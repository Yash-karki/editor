"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDocumentHandlers = void 0;
const Y = __importStar(require("yjs"));
const logger_1 = require("../../utils/logger");
// In-memory cache of active Y.Doc instances on this server node
// In a distributed setup, this would need Redis Pub/Sub integration
const activeDocuments = new Map();
const documentClients = new Map();
const setupDocumentHandlers = (socket, crdtManager) => {
    socket.on('join-document', async ({ documentId, userId, username, color, avatar_url }) => {
        try {
            socket.join(`doc:${documentId}`);
            // Initialize or get Y.Doc for this document
            let ydoc = activeDocuments.get(documentId);
            if (!ydoc) {
                ydoc = new Y.Doc();
                // Load initial state from DB
                await crdtManager.loadDocumentState(documentId, ydoc);
                activeDocuments.set(documentId, ydoc);
                documentClients.set(documentId, new Set());
            }
            const clients = documentClients.get(documentId);
            clients.add(socket.id);
            // Track active session in DB
            await global.db.query(`INSERT INTO active_sessions (document_id, user_id, socket_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (document_id, user_id) 
         DO UPDATE SET socket_id = $3, last_activity_at = CURRENT_TIMESTAMP`, [documentId, userId, socket.id]);
            // Notify others in the room
            socket.to(`doc:${documentId}`).emit('user-joined', {
                userId,
                username,
                avatar_url,
                color: color || '#45B7D1',
                socketId: socket.id
            });
            // Send current document state to the joining client
            const state = Y.encodeStateAsUpdate(ydoc);
            socket.emit('sync-update', { update: Array.from(state) });
            logger_1.logger.info(`User ${userId} joined document ${documentId}`);
        }
        catch (error) {
            logger_1.logger.error(`Error joining document: ${error}`);
            socket.emit('error', { message: 'Failed to join document' });
        }
    });
    socket.on('sync-update', async ({ documentId, userId, update }) => {
        try {
            const ydoc = activeDocuments.get(documentId);
            if (ydoc) {
                const updateArray = new Uint8Array(update);
                // Apply update to in-memory Y.Doc
                Y.applyUpdate(ydoc, updateArray);
                // Broadcast to other clients in the room
                socket.to(`doc:${documentId}`).emit('remote-update', { update });
                // Debounce database save (in a real app, use a proper queue/debouncer)
                // Here we just save it directly for simplicity, or we can offload to a worker
                await crdtManager.saveUpdate(documentId, userId, updateArray);
            }
        }
        catch (error) {
            logger_1.logger.error(`Error processing sync update: ${error}`);
        }
    });
    socket.on('mention', async ({ documentId, mentionedUserId, mentionedUsername }) => {
        try {
            // Save notification to DB
            await global.db.query(`INSERT INTO notifications (user_id, type, related_document_id, related_user_id, content)
         VALUES ($1, $2, $3, $4, $5)`, [
                mentionedUserId,
                'mention',
                documentId,
                socket.userId || mentionedUserId,
                `You were mentioned in a document.`
            ]);
            // Check if user is online to send real-time notification
            const sessionResult = await global.db.query('SELECT socket_id FROM active_sessions WHERE user_id = $1', [mentionedUserId]);
            if (sessionResult.rows.length > 0) {
                for (const row of sessionResult.rows) {
                    global.io.to(row.socket_id).emit('notification', {
                        type: 'mention',
                        documentId,
                        content: `You were mentioned in a document.`
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error(`Error processing mention notification: ${error}`);
        }
    });
    socket.on('disconnect', async () => {
        try {
            // Find which document this socket was in
            for (const [docId, clients] of documentClients.entries()) {
                if (clients.has(socket.id)) {
                    clients.delete(socket.id);
                    // Find user associated with this socket
                    const sessionResult = await global.db.query(`DELETE FROM active_sessions 
             WHERE socket_id = $1 
             RETURNING user_id, document_id`, [socket.id]);
                    if (sessionResult.rows.length > 0) {
                        const { user_id, document_id } = sessionResult.rows[0];
                        socket.to(`doc:${document_id}`).emit('user-left', { userId: user_id });
                    }
                    // Cleanup empty documents from memory
                    if (clients.size === 0) {
                        const ydoc = activeDocuments.get(docId);
                        if (ydoc) {
                            // Create a final snapshot before clearing from memory
                            await crdtManager.createSnapshot(docId, ydoc, null, 'auto-save on disconnect');
                        }
                        activeDocuments.delete(docId);
                        documentClients.delete(docId);
                    }
                }
            }
        }
        catch (error) {
            logger_1.logger.error(`Error on disconnect cleanup: ${error}`);
        }
    });
};
exports.setupDocumentHandlers = setupDocumentHandlers;
