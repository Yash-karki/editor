"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
class AuthService {
    db;
    constructor(db) {
        this.db = db;
    }
    async registerUser(email, username, password, fullName) {
        try {
            const existingUser = await this.db.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
            if (existingUser.rows.length > 0) {
                throw { statusCode: 409, message: 'User already exists' };
            }
            const passwordHash = await bcryptjs_1.default.hash(password, 10);
            const result = await this.db.query(`INSERT INTO users (email, username, password_hash, full_name)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, username, full_name, avatar_url, created_at`, [email, username, passwordHash, fullName]);
            const user = result.rows[0];
            const accessToken = this.generateAccessToken(user.id);
            const refreshToken = this.generateRefreshToken(user.id);
            return { user, accessToken, refreshToken };
        }
        catch (error) {
            logger_1.logger.error(`Error registering user: ${error}`);
            throw error;
        }
    }
    async loginUser(email, password) {
        try {
            const result = await this.db.query('SELECT id, password_hash, email, username, full_name, avatar_url FROM users WHERE email = $1', [email]);
            if (result.rows.length === 0) {
                throw { statusCode: 401, message: 'Invalid email or password' };
            }
            const user = result.rows[0];
            const isPasswordValid = await bcryptjs_1.default.compare(password, user.password_hash);
            if (!isPasswordValid) {
                throw { statusCode: 401, message: 'Invalid email or password' };
            }
            await this.db.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
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
        }
        catch (error) {
            logger_1.logger.error(`Error logging in user: ${error}`);
            throw error;
        }
    }
    async refreshAccessToken(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key');
            const accessToken = this.generateAccessToken(decoded.userId);
            return { accessToken };
        }
        catch (error) {
            throw { statusCode: 401, message: 'Invalid or expired refresh token' };
        }
    }
    generateAccessToken(userId) {
        return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET || 'dev-secret-key', { expiresIn: '7d' });
    }
    generateRefreshToken(userId) {
        return jsonwebtoken_1.default.sign({ userId }, process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key', { expiresIn: '30d' });
    }
}
exports.AuthService = AuthService;
