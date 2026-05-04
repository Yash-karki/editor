import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.json([]);
    }

    const result = await global.db.query(
      `SELECT id, username, full_name, avatar_url 
       FROM users 
       WHERE username ILIKE $1 OR full_name ILIKE $1
       LIMIT 10`,
      [`%${query}%`]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search users' });
  }
});

router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const { username, fullName, avatarUrl } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if username is already taken by someone else
    if (username) {
      const existingUser = await global.db.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, userId]
      );
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
    }

    const result = await global.db.query(
      `UPDATE users 
       SET username = COALESCE($1, username),
           full_name = COALESCE($2, full_name),
           avatar_url = COALESCE($3, avatar_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, username, email, full_name, avatar_url`,
      [username, fullName, avatarUrl, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
