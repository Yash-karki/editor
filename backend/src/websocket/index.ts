import { Server as SocketServer } from 'socket.io';
import { setupDocumentHandlers } from './handlers/documentHandler';
import { setupCursorHandlers } from './handlers/cursorHandler';
import { CRDTManager } from '../services/crdt/YjsManager';

export const configureWebsockets = (io: SocketServer, crdtManager: CRDTManager) => {
  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    if (userId) {
      (socket as any).userId = userId;
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    setupDocumentHandlers(socket, crdtManager);
    setupCursorHandlers(socket);

    socket.on('error', (err) => {
      console.error(`Socket Error: ${err.message}`);
    });
  });
};
