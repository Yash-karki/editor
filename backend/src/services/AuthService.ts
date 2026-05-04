import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { logger } from '../utils/logger';

export class AuthService {
  constructor(private db: Pool) {}

  async registerUser(email: string, username: string, password: string, fullName: string) {
    try {
      const existingUser = await this.db.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingUser.rows.length > 0) {
        throw { statusCode: 409, message: 'User already exists' };
      }

      const passwordHash = await bcryptjs.hash(password, 10);

      const result = await this.db.query(
        `INSERT INTO users (email, username, password_hash, full_name)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, username, full_name, avatar_url, created_at`,
        [email, username, passwordHash, fullName]
      );

      const user = result.rows[0];
      const accessToken = this.generateAccessToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id);

      return { user, accessToken, refreshToken };
    } catch (error) {
      logger.error(`Error registering user: ${error}`);
      throw error;
    }
  }

  async loginUser(email: string, password: string) {
    try {
      const result = await this.db.query(
        'SELECT id, password_hash, email, username, full_name, avatar_url FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        throw { statusCode: 401, message: 'Invalid email or password' };
      }

      const user = result.rows[0];
      const isPasswordValid = await bcryptjs.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        throw { statusCode: 401, message: 'Invalid email or password' };
      }

      await this.db.query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      const accessToken = this.generateAccessToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          avatar_url: user.avatar_url || null,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error(`Error logging in user: ${error}`);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key') as { userId: string };
      const accessToken = this.generateAccessToken(decoded.userId);
      return { accessToken };
    } catch (error) {
      throw { statusCode: 401, message: 'Invalid or expired refresh token' };
    }
  }

  private generateAccessToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '7d' }
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key',
      { expiresIn: '30d' }
    );
  }
}
