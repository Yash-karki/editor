"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AuthService_1 = require("../../services/AuthService");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
router.post('/register', validation_1.validateRegisterInput, async (req, res) => {
    try {
        const authService = new AuthService_1.AuthService(global.db);
        const { email, username, password, fullName } = req.body;
        const result = await authService.registerUser(email, username, password, fullName);
        res.status(201).json({
            success: true,
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        });
    }
    catch (error) {
        if (error.statusCode === 409) {
            res.status(409).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Registration failed' });
        }
    }
});
router.post('/login', validation_1.validateLoginInput, async (req, res) => {
    try {
        const authService = new AuthService_1.AuthService(global.db);
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);
        res.json({
            success: true,
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        });
    }
    catch (error) {
        if (error.statusCode === 401) {
            res.status(401).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Login failed' });
        }
    }
});
router.post('/refresh', async (req, res) => {
    try {
        const authService = new AuthService_1.AuthService(global.db);
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }
        const result = await authService.refreshAccessToken(refreshToken);
        res.json({
            success: true,
            accessToken: result.accessToken,
        });
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});
router.post('/logout', (req, res) => {
    res.json({ success: true });
});
exports.default = router;
