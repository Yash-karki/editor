import { Socket } from 'socket.io';
import { logger } from '../../utils/logger';

export const setupCursorHandlers = (socket: Socket) => {
  socket.on('cursor-position', async ({ documentId, userId, position, selection }) => {
    try {
      // Broadcast cursor change to others in the room
      socket.to(`doc:${documentId}`).emit('cursor-changed', {
        userId,
        position,
        selection
      });

      // Optionally update DB for persistence if needed, but usually kept in-memory
      // for performance. If needed:
      // await global.db.query(
      //   `UPDATE active_sessions 
      //    SET cursor_position = $1, selection_start = $2, selection_end = $3
      //    WHERE document_id = $4 AND user_id = $5`,
      //   [position, selection?.start, selection?.end, documentId, userId]
      // );
    } catch (error) {
      logger.error(`Error handling cursor position: ${error}`);
    }
  });
};
