const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.wmiyvcxniyslyweulihf:UfHaPPpBBl25uXUr@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

client.connect().then(async () => {
  // Kiểm tra bảng mới
  const res = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('QuestionBanks','QuestionBankQuestions','QuestionBankChoices') ORDER BY table_name;"
  );
  console.log('Tables created:', res.rows.map(r => r.table_name));

  // Kiểm tra cột mới
  const cols = await client.query(
    "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' AND ((table_name = 'Assignments' AND column_name = 'SourceQuestionBankId') OR (table_name = 'McqChoices' AND column_name = 'SourceQuestionBankChoiceId') OR (table_name = 'McqQuestions' AND column_name = 'SourceQuestionBankQuestionId')) ORDER BY table_name;"
  );
  console.log('New columns:', cols.rows);

  // Kiểm tra unique constraint
  const uq = await client.query(
    "SELECT conname FROM pg_constraint WHERE conname = 'UQ_UserAbilities_UserId_CourseId';"
  );
  console.log('Unique constraint UQ_UserAbilities_UserId_CourseId exists:', uq.rows.length > 0);

}).catch(e => console.error('Error:', e.message)).finally(() => client.end());
