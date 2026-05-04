import express, { Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logger } from '../../utils/logger';

const router = express.Router();

router.use(authMiddleware);

router.get('/documents/:documentId', async (req: AuthRequest, res: Response) => {
  try {
    const { documentId } = req.params;
    const result = await global.db.query(
      `SELECT c.*, u.username, u.full_name as user_full_name, u.avatar_url 
       FROM comments c 
       JOIN users u ON c.author_id = u.id 
       WHERE c.document_id = $1 
       ORDER BY c.created_at ASC`,
      [documentId]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error(`Error fetching comments: ${error}`);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { documentId, content, selectionStart, selectionEnd, parentCommentId } = req.body;
    
    const result = await global.db.query(
      `INSERT INTO comments (document_id, author_id, content, selection_start, selection_end, parent_comment_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [documentId, userId, content, selectionStart, selectionEnd, parentCommentId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error(`Error creating comment: ${error}`);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

router.put('/:commentId', async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;
    
    const result = await global.db.query(
      `UPDATE comments 
       SET content = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND author_id = $3
       RETURNING *`,
      [content, commentId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error(`Error updating comment: ${error}`);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

router.delete('/:commentId', async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.user!.id;
    
    const result = await global.db.query(
      `DELETE FROM comments 
       WHERE id = $1 AND author_id = $2
       RETURNING id`,
      [commentId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }
    res.json({ success: true });
  } catch (error) {
    logger.error(`Error deleting comment: ${error}`);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
