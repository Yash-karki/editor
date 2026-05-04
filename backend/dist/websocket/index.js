"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureWebsockets = void 0;
const documentHandler_1 = require("./handlers/documentHandler");
const cursorHandler_1 = require("./handlers/cursorHandler");
const configureWebsockets = (io, crdtManager) => {
    io.use((socket, next) => {
        const userId = socket.handshake.auth.userId;
        if (userId) {
            socket.userId = userId;
        }
        next();
    });
    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);
        (0, documentHandler_1.setupDocumentHandlers)(socket, crdtManager);
        (0, cursorHandler_1.setupCursorHandlers)(socket);
        socket.on('error', (err) => {
            console.error(`Socket Error: ${err.message}`);
        });
    });
};
exports.configureWebsockets = configureWebsockets;
