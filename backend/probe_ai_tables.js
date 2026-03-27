import 'dotenv/config';
import prisma from './src/lib/prisma.js';

async function check() {
  const columns = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'AiQuizChoices'
  `;
  console.log('AiQuizChoices columns:', columns);

  const fks = await prisma.$queryRaw`
    SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='AiQuizChoices';
  `;
  console.log('AiQuizChoices foreign keys:', fks);
  await prisma.$disconnect();
}

check();
