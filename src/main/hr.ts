import { ipcMain } from 'electron';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { db } from './db';
import { presences, salaries, users } from './schema';

export function setupHRHandlers() {
  // Presence (filtered by storeId)
  ipcMain.handle('presence:get-all', async (_, storeId?: number) => {
    try {
      const whereClause = storeId
        ? and(eq(presences.storeId, storeId))
        : undefined;
      
      const query = db.select({
        id: presences.id,
        userId: presences.userId,
        userName: users.name,
        status: presences.status,
        note: presences.note,
        createdAt: presences.createdAt
      })
      .from(presences)
      .leftJoin(users, eq(presences.userId, users.id));
      
      if (whereClause) {
        query.where(whereClause);
      }
      
      const result = await query.orderBy(desc(presences.createdAt));
      return result;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب قائمة الحضور');
    }
  });

  // Check-in (requires storeId)
  ipcMain.handle('presence:check-in', async (_, { userId, storeId, status, note, lat, long }) => {
    try {
      if (!storeId) {
        throw new Error('يجب تحديد المتجر');
      }
      
      await db.insert(presences).values({
        userId,
        storeId,
        status,
        note,
        lat: lat?.toString(),
        long: long?.toString()
      });
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل تسجيل الحضور');
    }
  });

  // Salaries (filtered by storeId)
  ipcMain.handle('salaries:get-all', async (_, storeId?: number) => {
    try {
      const whereClause = storeId
        ? and(eq(salaries.storeId, storeId), isNull(salaries.deletedAt))
        : isNull(salaries.deletedAt);
      
      const result = await db.select({
        id: salaries.id,
        userId: salaries.userId,
        userName: users.name,
        status: salaries.status,
        period: salaries.period,
        total: salaries.total,
        createdAt: salaries.createdAt
      })
      .from(salaries)
      .leftJoin(users, eq(salaries.userId, users.id))
      .where(whereClause)
      .orderBy(desc(salaries.createdAt));
      return result;
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب قائمة الرواتب');
    }
  });

  // Generate salary (requires storeId)
  ipcMain.handle('salaries:generate', async (_, data) => {
    try {
      if (!data.storeId) {
        throw new Error('يجب تحديد المتجر');
      }
      
      await db.insert(salaries).values({
        ...data,
        total: data.total.toString(),
        items: data.items, // JSONB
        deductions: data.deductions // JSONB
      });
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل إنشاء الراتب');
    }
  });

  // Users (Employees) - filtered by storeId if provided
  ipcMain.handle('users:get-all', async (_, storeId?: number) => {
    try {
      const whereClause = storeId
        ? and(eq(users.storeId, storeId), isNull(users.deletedAt))
        : isNull(users.deletedAt);
      
      return await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        storeId: users.storeId,
        createdAt: users.createdAt
      })
      .from(users)
      .where(whereClause);
    } catch (error: any) {
      throw new Error(error.message || 'فشل جلب قائمة المستخدمين');
    }
  });
}

