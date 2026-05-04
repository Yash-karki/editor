import express, { Request, Response } from 'express';
import { DocumentService } from '../../services/DocumentService';
import { CRDTManager } from '../../services/crdt/YjsManager';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logActivity } from '../../utils/activityLogger';

const router = express.Router();

router.use(authMiddleware);

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const documentService = new DocumentService(global.db);
    const { title, description } = req.body;
    const userId = req.user!.id;

    const document = await documentService.createDocument(title, description, userId);
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create document' });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const documentService = new DocumentService(global.db);
    const userId = req.user!.id;

    const documents = await documentService.getUserDocuments(userId);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const documentService = new DocumentService(global.db);
    const documentId = req.params.id as string;
    const userId = req.user!.id;

    const document = await documentService.getDocument(documentId, userId);
    res.json(document);
  } catch (error: any) {
    if (error.statusCode === 404) {
      res.status(404).json({ error: error.message });
    } else if (error.statusCode === 403) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const documentService = new DocumentService(global.db);
    const documentId = req.params.id as string;
    const userId = req.user!.id;
    const { title, description, visibility } = req.body;

    const updatedDocument = await documentService.updateDocument(
      documentId,
      userId,
      { title, description, visibility }
    );
    res.json(updatedDocument);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Update failed' });
  }
});

router.post('/:id/share', async (req: AuthRequest, res: Response) => {
  try {
    const documentId = req.params.id as string;
    const { email, permissionLevel } = req.body;
    
    // Look up user by email
    const userResult = await global.db.query(
      'SELECT id, username, full_name, email FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No user found with that email' });
    }

    const targetUser = userResult.rows[0];

    // Prevent sharing with yourself
    if (targetUser.id === req.user!.id) {
      return res.status(400).json({ error: 'You cannot share a document with yourself' });
    }

    await global.db.query(
      `INSERT INTO document_permissions (document_id, user_id, permission_level, granted_by_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (document_id, user_id) 
       DO UPDATE SET permission_level = $3`,
      [documentId, targetUser.id, permissionLevel || 'editor', req.user!.id]
    );

    await logActivity(global.db, documentId, req.user!.id, 'SHARE', { 
      sharedWith: targetUser.username, 
      permissionLevel: permissionLevel || 'editor' 
    });

    res.json({ success: true, user: { id: targetUser.id, username: targetUser.username, full_name: targetUser.full_name, email: targetUser.email, permission_level: permissionLevel || 'editor' } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to share document' });
  }
});

router.get('/:id/collaborators', async (req: AuthRequest, res: Response) => {
  try {
    const documentId = req.params.id as string;
    const result = await global.db.query(
      `SELECT u.id, u.username, u.full_name, u.email, u.avatar_url, dp.permission_level
       FROM document_permissions dp
       JOIN users u ON dp.user_id = u.id
       WHERE dp.document_id = $1`,
      [documentId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch collaborators' });
  }
});

router.get('/:id/versions', async (req: AuthRequest, res: Response) => {
  try {
    const crdtManager = new CRDTManager(global.db);
    const documentId = req.params.id as string;
    const history = await crdtManager.getVersionHistory(documentId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch version history' });
  }
});

router.post('/:id/restore-version', async (req: AuthRequest, res: Response) => {
  try {
    const crdtManager = new CRDTManager(global.db);
    const documentId = req.params.id as string;
    const { versionNumber } = req.body;
    
    // In a real app we'd save this restored doc as a new update or reset current state
    await crdtManager.restoreVersion(documentId, versionNumber);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore version' });
  }
});

export default router;
