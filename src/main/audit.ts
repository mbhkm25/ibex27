import { ipcMain } from 'electron';
import { eq, desc, and } from 'drizzle-orm';
import { db } from './db';
import { auditLogs } from './schema';

/**
 * Log an audit event
 */
export async function logAuditEvent(data: {
  storeId?: number;
  userId: number;
  action: string;
  entityType: string;
  entityId?: number;
  description?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  metadata?: Record<string, any>;
}) {
  try {
    await db.insert(auditLogs).values({
      storeId: data.storeId || null,
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId || null,
      description: data.description || null,
      oldValue: data.oldValue || null,
      newValue: data.newValue || null,
      metadata: data.metadata || null,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

export function setupAuditHandlers() {
  // Get audit logs for a store
  ipcMain.handle('audit:get-logs', async (_, { storeId, limit = 100 }: { storeId?: number; limit?: number }) => {
    try {
      const whereClause = storeId
        ? and(eq(auditLogs.storeId, storeId))
        : undefined;

      const result = await db
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);

      return result;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب سجل العمليات');
    }
  });

  // Get audit logs for a specific entity
  ipcMain.handle('audit:get-entity-logs', async (_, {
    entityType,
    entityId,
    limit = 50,
  }: {
    entityType: string;
    entityId: number;
    limit?: number;
  }) => {
    try {
      const result = await db
        .select()
        .from(auditLogs)
        .where(and(
          eq(auditLogs.entityType, entityType),
          eq(auditLogs.entityId, entityId)
        ))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);

      return result;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب سجل العمليات');
    }
  });
}

