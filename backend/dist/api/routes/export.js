"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const DocumentService_1 = require("../../services/DocumentService");
const logger_1 = require("../../utils/logger");
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.get('/documents/:id', async (req, res) => {
    try {
        const documentService = new DocumentService_1.DocumentService(global.db);
        const documentId = req.params.id;
        const userId = req.user.id;
        const { format } = req.query;
        const document = await documentService.getDocument(documentId, userId);
        if (format === 'markdown') {
            res.setHeader('Content-disposition', `attachment; filename=${document.title || 'document'}.md`);
            res.setHeader('Content-type', 'text/markdown');
            // In a real app we would convert Yjs / Prosemirror JSON to Markdown here.
            // For now we just dump the content or description.
            res.send(`# ${document.title}\n\n${document.description || ''}`);
        }
        else {
            res.status(400).json({ error: 'Unsupported format' });
        }
    }
    catch (error) {
        logger_1.logger.error(`Error exporting document: ${error}`);
        res.status(500).json({ error: 'Failed to export document' });
    }
});
exports.default = router;
