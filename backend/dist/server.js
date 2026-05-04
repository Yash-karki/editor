"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.pool = exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const ws_1 = require("ws");
const { setupWSConnection } = require('y-websocket/bin/utils');
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
const ioredis_1 = __importDefault(require("ioredis"));
const auth_1 = __importDefault(require("./api/routes/auth"));
const documents_1 = __importDefault(require("./api/routes/documents"));
const comments_1 = __importDefault(require("./api/routes/comments"));
const export_1 = __importDefault(require("./api/routes/export"));
const users_1 = __importDefault(require("./api/routes/users"));
const notifications_1 = __importDefault(require("./api/routes/notifications"));
const activity_1 = __importDefault(require("./api/routes/activity"));
const logger_1 = require("./utils/logger");
const websocket_1 = require("./websocket");
const YjsManager_1 = require("./services/crdt/YjsManager");
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST'],
    },
});
exports.io = io;
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/collab_doc',
    ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('pooler') ? { rejectUnauthorized: false } : undefined,
});
exports.pool = pool;
pool.on('error', (err) => {
    logger_1.logger.error(`PostgreSQL pool error: ${err.message}`);
});
pool.query('SELECT NOW()').then(() => {
    logger_1.logger.info('PostgreSQL connected');
}).catch(err => {
    logger_1.logger.error('PostgreSQL connection failed. Is the database running locally?');
});
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new ioredis_1.default(redisUrl, {
    tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    retryStrategy(times) {
        if (times > 3) {
            logger_1.logger.error('Redis connection failed. Stopping retries.');
            return null;
        }
        return Math.min(times * 500, 2000);
    },
    maxRetriesPerRequest: 3,
});
exports.redis = redis;
redis.on('error', (err) => {
    // Suppress connection errors to prevent process crash
    // Retry strategy handles reconnection logic
});
global.db = pool;
global.redis = redis;
global.io = io;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/auth', auth_1.default);
app.use('/api/documents', documents_1.default);
app.use('/api/comments', comments_1.default);
app.use('/api/export', export_1.default);
app.use('/api/users', users_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/activity', activity_1.default);
const crdtManager = new YjsManager_1.CRDTManager(pool);
(0, websocket_1.configureWebsockets)(io, crdtManager);
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});
const PORT = process.env.PORT || 3001;
const wss = new ws_1.WebSocketServer({ noServer: true });
server.on('upgrade', (request, socket, head) => {
    // Pass to y-websocket if it's a document sync path
    if (request.url && request.url.startsWith('/doc-')) {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    }
});
wss.on('connection', (ws, req) => {
    setupWSConnection(ws, req);
});
server.listen(PORT, () => {
    logger_1.logger.info(`Server running on port ${PORT}`);
});
