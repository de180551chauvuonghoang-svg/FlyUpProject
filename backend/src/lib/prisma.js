import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL || 
      process.env.DATABASE_URL.trim() === '' || 
      process.env.DATABASE_URL.includes('postgresql://...')) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ ERROR: DATABASE_URL IS NOT CONFIGURED');
    console.error('='.repeat(60));
    console.error('Vui lòng cập nhật file backend/.env với URL thực tế từ Supabase.');
    console.error('Database connection is required for FlyUp to function properly.');
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  }

  // Define postgres pool and prisma pg adapter
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: ['query', 'info', 'warn', 'error'],
  });
};

const globalForPrisma = global;

const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
