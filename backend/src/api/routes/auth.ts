import express, { Request, Response } from 'express';
import { AuthService } from '../../services/AuthService';
import { validateRegisterInput, validateLoginInput } from '../middleware/validation';

const router = express.Router();

interface AuthRequest extends Request {
  user?: { id: string };
}

router.post('/register', validateRegisterInput, async (req: AuthRequest, res: Response) => {
  try {
    const authService = new AuthService(global.db);
    const { email, username, password, fullName } = req.body;

    const result = await authService.registerUser(email, username, password, fullName);

    res.status(201).json({
      success: true,
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error: any) {
    if (error.statusCode === 409) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
});

router.post('/login', validateLoginInput, async (req: AuthRequest, res: Response) => {
  try {
    const authService = new AuthService(global.db);
    const { email, password } = req.body;

    const result = await authService.loginUser(email, password);

    res.json({
      success: true,
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error: any) {
    if (error.statusCode === 401) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Login failed' });
    }
  }
});

router.post('/refresh', async (req: AuthRequest, res: Response) => {
  try {
    const authService = new AuthService(global.db);
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      accessToken: result.accessToken,
    });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', (req: AuthRequest, res: Response) => {
  res.json({ success: true });
});

export default router;
