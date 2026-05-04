import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await global.db.query(
      `SELECT n.*, u.username as from_username, u.avatar_url as from_avatar_url, d.title as document_title
       FROM notifications n
       LEFT JOIN users u ON n.related_user_id = u.id
       LEFT JOIN documents d ON n.related_document_id = d.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.put('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    await global.db.query(
      'UPDATE notifications SET read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

export default router;
