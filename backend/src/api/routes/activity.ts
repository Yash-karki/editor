import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

router.get('/documents/:documentId', async (req: AuthRequest, res: Response) => {
  try {
    const { documentId } = req.params;
    const result = await global.db.query(
      `SELECT al.*, u.username, u.full_name, u.avatar_url 
       FROM activity_logs al 
       LEFT JOIN users u ON al.user_id = u.id 
       WHERE al.document_id = $1 
       ORDER BY al.created_at DESC 
       LIMIT 50`,
      [documentId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

export default router;
