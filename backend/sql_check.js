import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.wmiyvcxniyslyweulihf:UfHaPPpBBl25uXUr@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connect_timeout=30";

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to DB');
    
    // List all tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in public schema:', tablesRes.rows.map(r => r.table_name).join(', '));
    
    // Check if any table names contain "quiz" (case-insensitive)
    const quizTables = tablesRes.rows.filter(r => r.table_name.toLowerCase().includes('quiz'));
    console.log('Tables matching "quiz":', quizTables.map(r => r.table_name).join(', '));

    // Check row counts for MCQ and QB questions
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM "McqQuestions") as mcq_count,
        (SELECT COUNT(*) FROM "QuestionBankQuestions") as qb_count,
        (SELECT COUNT(*) FROM "Assignments") as assignment_count
    `);
    console.log('Counts:', counts.rows[0]);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();
