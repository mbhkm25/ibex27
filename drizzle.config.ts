/// <reference types="node" />
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Load environment variables with proper error handling
 * This ensures .env is read correctly even in PowerShell
 */
function loadEnvFile(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  
  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  .env file not found at:', envPath);
    return;
  }

  // Read .env file manually and set process.env
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    // Skip comments and empty lines
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    
    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex === -1) continue;
    
    const key = trimmedLine.substring(0, equalIndex).trim();
    let value = trimmedLine.substring(equalIndex + 1).trim();
    
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    // Only set if not already in process.env (respect system env vars unless override)
    if (!process.env[key] || process.env[key] === '') {
      process.env[key] = value;
    }
  }
  
  // Also use dotenv as fallback
  dotenv.config({ path: envPath, override: false });
}

// Load .env file
loadEnvFile();

/**
 * Get database connection string for Drizzle Kit
 * Supports both local and cloud databases based on DB_ENV
 */
function getConnectionString(): string {
  const dbEnv = process.env.DB_ENV || 'cloud';
  console.log('🔍 DB_ENV:', dbEnv);
  console.log('🔍 DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('🔍 DATABASE_URL_LOCAL exists:', !!process.env.DATABASE_URL_LOCAL);
  
  if (dbEnv === 'local' && process.env.DATABASE_URL_LOCAL) {
    console.log('📍 Drizzle Kit: Using LOCAL database');
    return process.env.DATABASE_URL_LOCAL;
  }
  
  console.log('☁️  Drizzle Kit: Using CLOUD database (Neon)');
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL is not set!');
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE')));
    throw new Error(
      'DATABASE_URL is not set in environment variables.\n' +
      'Please create a .env file with DATABASE_URL.\n' +
      'For local development, set DB_ENV=local and DATABASE_URL_LOCAL'
    );
  }
  
  console.log('✅ Using connection string:', connectionString.substring(0, 50) + '...');
  return connectionString;
}

export default {
  schema: './src/main/schema.ts',
  out: './drizzle',
  driver: 'pg',
  verbose: true,
  strict: true,
  dbCredentials: {
    connectionString: getConnectionString(),
  },
} satisfies Config;

