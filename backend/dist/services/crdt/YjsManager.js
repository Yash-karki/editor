"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRDTManager = void 0;
const Y = __importStar(require("yjs"));
const logger_1 = require("../../utils/logger");
class CRDTManager {
    db;
    constructor(db) {
        this.db = db;
    }
    async loadDocumentState(documentId, ydoc) {
        try {
            const result = await this.db.query(`SELECT yjs_state FROM document_snapshots 
         WHERE document_id = $1 
         ORDER BY version_number DESC 
         LIMIT 1`, [documentId]);
            if (result.rows.length > 0) {
                const state = result.rows[0].yjs_state;
                Y.applyUpdate(ydoc, state);
            }
            const updatesResult = await this.db.query(`SELECT update_data FROM document_updates 
         WHERE document_id = $1 
         ORDER BY timestamp ASC`, [documentId]);
            for (const row of updatesResult.rows) {
                Y.applyUpdate(ydoc, row.update_data);
            }
        }
        catch (error) {
            logger_1.logger.error(`Error loading document: ${error}`);
            throw error;
        }
    }
    async saveUpdate(documentId, userId, update) {
        try {
            await this.db.query(`INSERT INTO document_updates (document_id, user_id, update_data)
         VALUES ($1, $2, $3)`, [documentId, userId, update]);
            await this.db.query(`UPDATE documents 
         SET last_edited_at = CURRENT_TIMESTAMP, last_edited_by_id = $1
         WHERE id = $2`, [userId, documentId]);
        }
        catch (error) {
            logger_1.logger.error(`Error saving update: ${error}`);
            throw error;
        }
    }
    async createSnapshot(documentId, ydoc, userId, summary) {
        try {
            const state = Y.encodeStateAsUpdate(ydoc);
            const versionResult = await this.db.query(`SELECT COALESCE(MAX(version_number), 0) + 1 as next_version 
         FROM document_snapshots WHERE document_id = $1`, [documentId]);
            const nextVersion = versionResult.rows[0].next_version;
            await this.db.query(`INSERT INTO document_snapshots (document_id, version_number, yjs_state, created_by_id, change_summary)
         VALUES ($1, $2, $3, $4, $5)`, [documentId, nextVersion, state, userId, summary]);
        }
        catch (error) {
            logger_1.logger.error(`Error creating snapshot: ${error}`);
            throw error;
        }
    }
    async restoreVersion(documentId, versionNumber) {
        try {
            const snapshotResult = await this.db.query(`SELECT yjs_state FROM document_snapshots 
         WHERE document_id = $1 AND version_number = $2`, [documentId, versionNumber]);
            if (snapshotResult.rows.length === 0) {
                throw new Error(`Snapshot not found for document ${documentId} version ${versionNumber}`);
            }
            const ydoc = new Y.Doc();
            const state = snapshotResult.rows[0].yjs_state;
            Y.applyUpdate(ydoc, state);
            return ydoc;
        }
        catch (error) {
            logger_1.logger.error(`Error restoring version: ${error}`);
            throw error;
        }
    }
    async getVersionHistory(documentId) {
        try {
            const result = await this.db.query(`SELECT ds.version_number, ds.snapshot_at, ds.created_by_id, ds.change_summary, u.username, u.avatar_url
         FROM document_snapshots ds
         LEFT JOIN users u ON ds.created_by_id = u.id
         WHERE ds.document_id = $1
         ORDER BY ds.version_number DESC`, [documentId]);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching version history: ${error}`);
            throw error;
        }
    }
}
exports.CRDTManager = CRDTManager;
