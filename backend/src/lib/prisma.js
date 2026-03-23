import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
    console.error('❌ Error: DATABASE_URL is missing or invalid in environment variables.');
    process.exit(1);
  }

  return new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
};

const globalForPrisma = global;

const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
