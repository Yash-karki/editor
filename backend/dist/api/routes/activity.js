"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.get('/documents/:documentId', async (req, res) => {
    try {
        const { documentId } = req.params;
        const result = await global.db.query(`SELECT al.*, u.username, u.full_name, u.avatar_url 
       FROM activity_logs al 
       LEFT JOIN users u ON al.user_id = u.id 
       WHERE al.document_id = $1 
       ORDER BY al.created_at DESC 
       LIMIT 50`, [documentId]);
        res.json(result.rows);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
});
exports.default = router;
