"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const logger_1 = require("../utils/logger");
class DocumentService {
    db;
    constructor(db) {
        this.db = db;
    }
    async createDocument(title, description, userId) {
        try {
            const result = await this.db.query(`INSERT INTO documents (title, description, owner_id)
         VALUES ($1, $2, $3)
         RETURNING *`, [title, description, userId]);
            const document = result.rows[0];
            // Add owner permission
            await this.db.query(`INSERT INTO document_permissions (document_id, user_id, permission_level)
         VALUES ($1, $2, 'owner')`, [document.id, userId]);
            return document;
        }
        catch (error) {
            logger_1.logger.error(`Error creating document: ${error}`);
            throw error;
        }
    }
    async getDocument(documentId, userId) {
        try {
            // First check permissions
            const permResult = await this.db.query(`SELECT d.*, dp.permission_level 
         FROM documents d
         LEFT JOIN document_permissions dp ON d.id = dp.document_id AND dp.user_id = $2
         WHERE d.id = $1 AND d.is_deleted = false`, [documentId, userId]);
            if (permResult.rows.length === 0) {
                throw { statusCode: 404, message: 'Document not found' };
            }
            const doc = permResult.rows[0];
            if (doc.visibility === 'private' && !doc.permission_level) {
                throw { statusCode: 403, message: 'Access denied' };
            }
            return doc;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching document: ${error}`);
            throw error;
        }
    }
    async getUserDocuments(userId) {
        try {
            const result = await this.db.query(`SELECT d.id, d.title, d.description, d.updated_at, d.visibility, d.owner_id, dp.permission_level
         FROM documents d
         JOIN document_permissions dp ON d.id = dp.document_id
         WHERE dp.user_id = $1 AND d.is_deleted = false
         ORDER BY d.updated_at DESC`, [userId]);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching user documents: ${error}`);
            throw error;
        }
    }
    async updateDocument(documentId, userId, updates) {
        try {
            // Basic permission check - only owner or editor can update metadata
            const permResult = await this.db.query(`SELECT permission_level FROM document_permissions 
         WHERE document_id = $1 AND user_id = $2`, [documentId, userId]);
            if (permResult.rows.length === 0 || !['owner', 'editor'].includes(permResult.rows[0].permission_level)) {
                throw { statusCode: 403, message: 'Permission denied to update document metadata' };
            }
            const { title, description, visibility } = updates;
            const result = await this.db.query(`UPDATE documents 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             visibility = COALESCE($3, visibility),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`, [title, description, visibility, documentId]);
            return result.rows[0];
        }
        catch (error) {
            logger_1.logger.error(`Error updating document: ${error}`);
            throw error;
        }
    }
}
exports.DocumentService = DocumentService;
