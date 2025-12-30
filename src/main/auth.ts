import { ipcMain } from 'electron';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from './db';
import { users, stores, customers, customerStoreRelations } from './schema';
import bcrypt from 'bcryptjs';

export async function checkAndSeedAdmin() {
  try {
    // Check if admin exists (not deleted)
    const existingAdmin = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, 'admin@ibex.com'),
          eq(users.role, 'platform_admin'),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.insert(users).values({
        name: 'مدير النظام',
        email: 'admin@ibex.com',
        password: hashedPassword,
        role: 'platform_admin',
        status: 'active',
      });
      console.log('✅ Admin user created successfully');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Failed to seed admin:', error);
  }
}

/**
 * Seed test users for development (merchant, cashier, customer)
 */
export async function seedTestUsers() {
  try {

    // Check and create test merchant
    const existingMerchant = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, 'merchant@example.com'),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    if (existingMerchant.length === 0) {
      const hashedPassword = await bcrypt.hash('merchant123', 10);
      await db.insert(users).values({
        name: 'تاجر تجريبي',
        email: 'merchant@example.com',
        password: hashedPassword,
        role: 'merchant',
        status: 'active',
      });
      console.log('✅ Test merchant created');
    }

    // Check and create test cashier
    const existingCashier = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, 'cashier@example.com'),
          isNull(users.deletedAt)
        )
      )
      .limit(1);

    // Ensure we have a store first (Merchant's store)
    let storeId: number | null = null;
    
    // Find merchant first
    const merchantUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'merchant@example.com'))
      .limit(1);

    if (merchantUser[0]) {
      // Find merchant's store
      const merchantStore = await db
        .select()
        .from(stores)
        .where(eq(stores.merchantId, merchantUser[0].id))
        .limit(1);
      
      if (merchantStore[0]) {
        storeId = merchantStore[0].id;
      } else {
        // Create store for merchant if not exists
        const newStore = await db.insert(stores).values({
          name: 'متجر تجريبي',
          slug: 'test-store',
          merchantId: merchantUser[0].id,
          subscriptionStatus: 'active', // Ensure active for testing
        }).returning();
        storeId = newStore[0].id;
        console.log('✅ Created test store for merchant');
      }
    }

    if (existingCashier.length === 0 && storeId) {
      const hashedPassword = await bcrypt.hash('cashier123', 10);
      await db.insert(users).values({
        name: 'كاشير تجريبي',
        email: 'cashier@example.com',
        password: hashedPassword,
        role: 'cashier',
        storeId: storeId, // Link to the SAME store
        status: 'active',
      });
      console.log('✅ Test cashier created and linked to store');
    }

    // Check and create test customer
    const existingCustomer = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.phone, '771234567'),
          isNull(customers.deletedAt)
        )
      )
      .limit(1);

    if (existingCustomer.length === 0 && storeId) {
      const hashedPassword = await bcrypt.hash('customer123', 10);
      const newCustomer = await db.insert(customers).values({
        name: 'عميل تجريبي',
        phone: '771234567',
        password: hashedPassword,
        registrationStatus: 'approved',
        status: true,
      }).returning();

      // Link customer to the SAME store
      await db.insert(customerStoreRelations).values({
        customerId: newCustomer[0].id,
        storeId: storeId,
        status: 'active',
      });

      console.log('✅ Test customer created and linked to store');
    } else if (existingCustomer.length > 0 && storeId) {
      // Ensure existing customer is linked
      const relation = await db
        .select()
        .from(customerStoreRelations)
        .where(
          and(
            eq(customerStoreRelations.customerId, existingCustomer[0].id),
            eq(customerStoreRelations.storeId, storeId)
          )
        )
        .limit(1);
        
      if (relation.length === 0) {
        await db.insert(customerStoreRelations).values({
          customerId: existingCustomer[0].id,
          storeId: storeId,
          status: 'active',
        });
        console.log('✅ Test customer linked to store');
      }
    }
  } catch (error) {
    console.error('❌ Failed to seed test users:', error);
  }
}

export function setupAuthHandlers() {
  ipcMain.handle('auth:login', async (_, { email, password }) => {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = result[0];

      if (!user) {
        throw new Error('البريد الإلكتروني غير موجود');
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        throw new Error('كلمة المرور غير صحيحة');
      }

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error: any) {
      throw new Error(error.message || 'حدث خطأ أثناء تسجيل الدخول');
    }
  });

  ipcMain.handle('auth:register', async (_, data) => {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      await db.insert(users).values({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || 'user'
      });
      return true;
    } catch (error: any) {
      throw new Error(error.message || 'فشل تسجيل المستخدم');
    }
  });

  // Register new merchant
  ipcMain.handle('auth:register-merchant', async (_, data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    try {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('البريد الإلكتروني غير صحيح');
      }

      // Validate phone (9 digits)
      const cleanedPhone = data.phone.replace(/\D/g, '');
      if (cleanedPhone.length !== 9) {
        throw new Error('رقم الجوال يجب أن يكون 9 أرقام');
      }

      // Validate password
      if (data.password.length < 6) {
        throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      }

      // Check if email already exists with retry logic
      let existingUser;
      let retries = 3;
      while (retries > 0) {
        try {
          existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, data.email.toLowerCase()))
            .limit(1);
          break;
        } catch (dbError: any) {
          retries--;
          if (retries === 0) {
            console.error('Database connection error:', dbError);
            if (dbError.code === 'ECONNRESET' || dbError.message?.includes('ECONNRESET')) {
              throw new Error('انقطع الاتصال بقاعدة البيانات. يرجى المحاولة مرة أخرى.');
            }
            throw new Error('فشل الاتصال بقاعدة البيانات. يرجى المحاولة مرة أخرى.');
          }
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (existingUser && existingUser.length > 0) {
        throw new Error('البريد الإلكتروني مسجل بالفعل');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create new merchant user with retry logic
      retries = 3;
      while (retries > 0) {
        try {
          await db.insert(users).values({
            name: data.name.trim(),
            email: data.email.toLowerCase().trim(),
            password: hashedPassword,
            role: 'merchant',
            status: 'pending', // Requires platform admin approval
          });
          break;
        } catch (dbError: any) {
          retries--;
          if (retries === 0) {
            console.error('Database insert error:', dbError);
            if (dbError.code === 'ECONNRESET' || dbError.message?.includes('ECONNRESET')) {
              throw new Error('انقطع الاتصال بقاعدة البيانات. يرجى المحاولة مرة أخرى.');
            }
            if (dbError.code === '23505') { // Unique constraint violation
              throw new Error('البريد الإلكتروني مسجل بالفعل');
            }
            throw new Error('فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
          }
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return {
        success: true,
        message: 'تم إنشاء الحساب بنجاح. سيتم مراجعته من قبل مدير المنصة.',
      };
    } catch (error: any) {
      console.error('Register merchant error:', error);
      // Return user-friendly error message
      if (error.message) {
        throw new Error(error.message);
      }
      throw new Error('فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
    }
  });
}
