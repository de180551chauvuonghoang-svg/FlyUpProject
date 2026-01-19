import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;
  // Giảm connection_limit xuống 3 để tránh lỗi quá tải Pool (Supabase Session Mode limit)
  const url = connectionString.includes('?') 
    ? `${connectionString}&connection_limit=3&pool_timeout=20` 
    : `${connectionString}?connection_limit=3&pool_timeout=20`;

  return new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    datasources: {
      db: {
        url,
      },
    },
  });
};

const globalForPrisma = global;

const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
