import express, { Express, Request, Response } from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import { WebSocketServer } from 'ws';
const { setupWSConnection } = require('y-websocket/bin/utils');
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import Redis from 'ioredis';
import authRoutes from './api/routes/auth';
import documentRoutes from './api/routes/documents';
import commentsRoutes from './api/routes/comments';
import exportRoutes from './api/routes/export';
import usersRoutes from './api/routes/users';
import notificationsRoutes from './api/routes/notifications';
import activityRoutes from './api/routes/activity';
import { logger } from './utils/logger';
import { configureWebsockets } from './websocket';
import { CRDTManager } from './services/crdt/YjsManager';

dotenv.config();

const app: Express = express();
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/collab_doc',
  ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('pooler') ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  logger.error(`PostgreSQL pool error: ${err.message}`);
});

pool.query('SELECT NOW()').then(() => {
  logger.info('PostgreSQL connected');
}).catch(err => {
  logger.error('PostgreSQL connection failed. Is the database running locally?');
});

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl, {
  tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
  retryStrategy(times) {
    if (times > 3) {
      logger.error('Redis connection failed. Stopping retries.');
      return null;
    }
    return Math.min(times * 500, 2000);
  },
  maxRetriesPerRequest: 3,
});

redis.on('error', (err: any) => {
  // Suppress connection errors to prevent process crash
  // Retry strategy handles reconnection logic
});

declare global {
  var db: Pool;
  var redis: Redis;
  var io: SocketServer;
}

global.db = pool;
global.redis = redis;
global.io = io;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/activity', activityRoutes);

const crdtManager = new CRDTManager(pool);
configureWebsockets(io, crdtManager);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 3001;

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  const pathname = url.pathname;
  
  if (pathname.startsWith('/doc-')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    // Other upgrades (like socket.io) are handled by the library automatically
    // but we can log if something else tries to upgrade
  }
});

wss.on('connection', (ws, req) => {
  // room name is the path without the leading slash
  const roomName = req.url?.slice(1) || 'default';
  logger.info(`Yjs connection established for room: ${roomName}`);
  setupWSConnection(ws, req);
});

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export { app, server, io, pool, redis };
