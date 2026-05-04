import express, { Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { DocumentService } from '../../services/DocumentService';
import { logger } from '../../utils/logger';

const router = express.Router();

router.use(authMiddleware);

router.get('/documents/:id', async (req: AuthRequest, res: Response) => {
  try {
    const documentService = new DocumentService(global.db);
    const documentId = req.params.id as string;
    const userId = req.user!.id;
    const { format } = req.query;

    const document = await documentService.getDocument(documentId, userId);
    
    if (format === 'markdown') {
      res.setHeader('Content-disposition', `attachment; filename=${document.title || 'document'}.md`);
      res.setHeader('Content-type', 'text/markdown');
      // In a real app we would convert Yjs / Prosemirror JSON to Markdown here.
      // For now we just dump the content or description.
      res.send(`# ${document.title}\n\n${document.description || ''}`);
    } else {
      res.status(400).json({ error: 'Unsupported format' });
    }
  } catch (error) {
    logger.error(`Error exporting document: ${error}`);
    res.status(500).json({ error: 'Failed to export document' });
  }
});

export default router;
