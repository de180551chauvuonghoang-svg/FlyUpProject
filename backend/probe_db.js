import prisma from './src/lib/prisma.js';

async function checkTables() {
  try {
    console.log('--- Checking for AI Quiz tables ---');
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name ILIKE 'aiquizzes' OR table_name ILIKE 'aiquizquestions' OR table_name ILIKE 'aiquizchoices')
    `;
    
    console.log('Found tables:', tables);
    
    if (tables.length < 3) {
      console.error('CRITICAL: Some AI Quiz tables are missing!');
    } else {
      console.log('All AI Quiz tables are present.');
    }
  } catch (err) {
    console.error('Prisma probe failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
