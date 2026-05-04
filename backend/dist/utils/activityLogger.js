"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = logActivity;
const logger_1 = require("./logger");
async function logActivity(db, documentId, userId, action, details = {}) {
    try {
        await db.query(`INSERT INTO activity_logs (document_id, user_id, action, details)
       VALUES ($1, $2, $3, $4)`, [documentId, userId, action, JSON.stringify(details)]);
    }
    catch (error) {
        logger_1.logger.error(`Failed to log activity: ${error}`);
    }
}
