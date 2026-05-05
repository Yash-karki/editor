import { Pool } from 'pg';
import { logger } from '../utils/logger';

export class DocumentService {
  constructor(private db: Pool) {}

  async createDocument(title: string, description: string | undefined, userId: string) {
    try {
      const result = await this.db.query(
        `INSERT INTO documents (title, description, owner_id)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [title, description, userId]
      );
      
      const document = result.rows[0];

      // Add owner permission
      await this.db.query(
        `INSERT INTO document_permissions (document_id, user_id, permission_level)
         VALUES ($1, $2, 'owner')`,
        [document.id, userId]
      );

      return document;
    } catch (error) {
      logger.error(`Error creating document: ${error}`);
      throw error;
    }
  }

  async getDocument(documentId: string, userId: string) {
    try {
      // First check permissions
      const permResult = await this.db.query(
        `SELECT d.*, dp.permission_level 
         FROM documents d
         LEFT JOIN document_permissions dp ON d.id = dp.document_id AND dp.user_id = $2
         WHERE d.id = $1 AND d.is_deleted = false`,
        [documentId, userId]
      );

      if (permResult.rows.length === 0) {
        throw { statusCode: 404, message: 'Document not found' };
      }

      const doc = permResult.rows[0];

      if (doc.visibility === 'private' && !doc.permission_level) {
        throw { statusCode: 403, message: 'Access denied' };
      }

      return doc;
    } catch (error) {
      logger.error(`Error fetching document: ${error}`);
      throw error;
    }
  }

  async getUserDocuments(userId: string) {
    try {
      const result = await this.db.query(
        `SELECT d.id, d.title, d.description, d.updated_at, d.visibility, d.owner_id, dp.permission_level
         FROM documents d
         JOIN document_permissions dp ON d.id = dp.document_id
         WHERE dp.user_id = $1 AND d.is_deleted = false
         ORDER BY d.updated_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      logger.error(`Error fetching user documents: ${error}`);
      throw error;
    }
  }

  async updateDocument(documentId: string, userId: string, updates: any) {
    try {
      // Basic permission check - only owner or editor can update metadata
      const permResult = await this.db.query(
        `SELECT permission_level FROM document_permissions 
         WHERE document_id = $1 AND user_id = $2`,
        [documentId, userId]
      );

      if (permResult.rows.length === 0 || !['owner', 'editor'].includes(permResult.rows[0].permission_level)) {
        throw { statusCode: 403, message: 'Permission denied to update document metadata' };
      }

      const { title, description, visibility, content } = updates;
      
      const result = await this.db.query(
        `UPDATE documents 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             visibility = COALESCE($3, visibility),
             content = COALESCE($4, content),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [title, description, visibility, content, documentId]
      );

      return result.rows[0];
    } catch (error) {
      logger.error(`Error updating document: ${error}`);
      throw error;
    }
  }
}
