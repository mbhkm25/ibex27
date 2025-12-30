# Script to run db:push with automatic confirmation
$env:DATABASE_URL = "postgresql://neondb_owner:npg_81FTgGbhISvQ@ep-morning-union-a7vq0d6n-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require"
$env:DB_ENV = "cloud"

# Run db:push - user will need to confirm manually
npm run db:push

