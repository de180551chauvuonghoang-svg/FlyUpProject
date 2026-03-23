import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
    console.error('❌ Error: DATABASE_URL is missing or invalid in environment variables.');
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
