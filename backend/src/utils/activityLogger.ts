import { Pool } from 'pg';
import { logger } from './logger';

export async function logActivity(
  db: Pool,
  documentId: string,
  userId: string,
  action: string,
  details: any = {}
) {
  try {
    await db.query(
      `INSERT INTO activity_logs (document_id, user_id, action, details)
       VALUES ($1, $2, $3, $4)`,
      [documentId, userId, action, JSON.stringify(details)]
    );
  } catch (error) {
    logger.error(`Failed to log activity: ${error}`);
  }
}
