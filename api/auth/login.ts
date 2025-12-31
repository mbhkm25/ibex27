import type { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, isNull } from 'drizzle-orm';
import { users } from '../../src/main/schema';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Connect to Neon Database
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return res.status(500).json({ error: 'Database connection not configured' });
    }

    const sql = postgres(connectionString, { ssl: 'require', max: 1 });
    const db = drizzle(sql);

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
      .limit(1);

    if (!user) {
      await sql.end();
      return res.status(401).json({ error: 'البريد الإلكتروني غير موجود' });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await sql.end();
      return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      await sql.end();
      return res.status(403).json({ error: 'حسابك غير مفعّل. يرجى التواصل مع الإدارة' });
    }

    await sql.end();

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json(userWithoutPassword);
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

