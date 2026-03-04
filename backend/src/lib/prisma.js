import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || typeof connectionString !== 'string' || connectionString.trim() === '') {
    console.error('❌ Error: DATABASE_URL is missing or invalid in environment variables.');
    process.exit(1);
  }

  const pool = new pg.Pool({ 
    connectionString, 
    max: 10 // Transaction Mode supports more connections
  });
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
