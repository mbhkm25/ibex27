import { ipcMain } from 'electron';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from './db';
import { customers, customerStoreRelations, stores } from './schema';
import bcrypt from 'bcryptjs';
import { validatePassword } from '../shared/utils/validation';
import { validatePhone } from '../shared/utils/currency';

export function setupCustomerAuthHandlers() {
  // Customer registration request
  ipcMain.handle('customer-auth:register', async (_, data: {
    name: string;
    phone: string;
    whatsapp?: string;
    password: string;
    storeSlug: string; // Store slug from registration link
  }) => {
    try {
      // Validate phone (9 digits)
      const cleanedPhone = data.phone.replace(/\D/g, '');
      if (!validatePhone(cleanedPhone)) {
        throw new Error('رقم الجوال يجب أن يكون 9 أرقام');
      }

      // Validate password
      if (!validatePassword(data.password)) {
        throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      }

      // Get store by slug
      const store = await db
        .select()
        .from(stores)
        .where(and(eq(stores.slug, data.storeSlug), isNull(stores.deletedAt)))
        .limit(1);

      if (store.length === 0) {
        throw new Error('المتجر غير موجود');
      }

      const storeData = store[0];

      // Check if customer already exists with this phone
      const existingCustomer = await db
        .select()
        .from(customers)
        .where(and(eq(customers.phone, cleanedPhone), isNull(customers.deletedAt)))
        .limit(1);

      let customerId: number;

      if (existingCustomer.length > 0) {
        // Customer exists, check if already registered in this store
        customerId = existingCustomer[0].id;
        
        const existingRelation = await db
          .select()
          .from(customerStoreRelations)
          .where(and(
            eq(customerStoreRelations.customerId, customerId),
            eq(customerStoreRelations.storeId, storeData.id)
          ))
          .limit(1);

        if (existingRelation.length > 0) {
          throw new Error('أنت مسجل بالفعل في هذا المتجر');
        }

        // Create new relation for existing customer
        await db.insert(customerStoreRelations).values({
          customerId,
          storeId: storeData.id,
          balance: '0',
          status: 'active',
          registeredAt: new Date(),
        });
      } else {
        // New customer - hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create new customer
        const newCustomer = await db.insert(customers).values({
          name: data.name,
          phone: cleanedPhone,
          whatsapp: data.whatsapp || cleanedPhone,
          password: hashedPassword,
          registrationStatus: 'pending', // Requires merchant approval
          balance: '0',
          status: true,
        }).returning();

        customerId = newCustomer[0].id;

        // Create store relation
        await db.insert(customerStoreRelations).values({
          customerId,
          storeId: storeData.id,
          balance: '0',
          status: 'active',
          registeredAt: new Date(),
        });
      }

      return {
        success: true,
        message: 'تم إرسال طلب التسجيل بنجاح. سيتم مراجعته من قبل التاجر.',
        customerId,
      };
    } catch (error: any) {
      throw new Error(error.message || 'فشل تسجيل العميل');
    }
  });

  // Customer login
  ipcMain.handle('customer-auth:login', async (_, { phone, password }: {
    phone: string;
    password: string;
  }) => {
    try {
      const cleanedPhone = phone.replace(/\D/g, '');

      // Find customer
      const result = await db
        .select()
        .from(customers)
        .where(and(eq(customers.phone, cleanedPhone), isNull(customers.deletedAt)))
        .limit(1);

      if (result.length === 0) {
        throw new Error('رقم الجوال غير مسجل');
      }

      const customer = result[0];

      // Check registration status
      if (customer.registrationStatus !== 'approved') {
        throw new Error('طلب التسجيل قيد المراجعة. يرجى الانتظار حتى يتم الموافقة عليه.');
      }

      // Verify password
      const valid = await bcrypt.compare(password, customer.password);
      if (!valid) {
        throw new Error('كلمة المرور غير صحيحة');
      }

      // Get customer stores
      const customerStores = await db
        .select({
          store: stores,
          relation: customerStoreRelations,
        })
        .from(customerStoreRelations)
        .innerJoin(stores, eq(customerStoreRelations.storeId, stores.id))
        .where(and(
          eq(customerStoreRelations.customerId, customer.id),
          eq(customerStoreRelations.status, 'active'),
          isNull(stores.deletedAt)
        ));

      // Remove password from response
      const { password: _, ...customerWithoutPassword } = customer;

      return {
        customer: customerWithoutPassword,
        stores: customerStores.map(cs => ({
          ...cs.store,
          balance: cs.relation.balance,
          registeredAt: cs.relation.registeredAt,
        })),
      };
    } catch (error: any) {
      throw new Error(error.message || 'فشل تسجيل الدخول');
    }
  });

  // Approve customer registration (merchant action)
  ipcMain.handle('customer-auth:approve', async (_, customerId: number) => {
    try {
      await db.update(customers)
        .set({ registrationStatus: 'approved' })
        .where(eq(customers.id, customerId));
      
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل الموافقة على التسجيل');
    }
  });

  // Reject customer registration (merchant action)
  ipcMain.handle('customer-auth:reject', async (_, customerId: number) => {
    try {
      await db.update(customers)
        .set({ registrationStatus: 'rejected' })
        .where(eq(customers.id, customerId));
      
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل رفض التسجيل');
    }
  });
}

