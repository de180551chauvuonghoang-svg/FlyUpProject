import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const pool = new pg.Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const sql = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS "AiQuizzes" (
        "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "CourseId" UUID NOT NULL,
        "LessonId" UUID,
        "CreatorId" UUID NOT NULL,
        "Difficulty" VARCHAR(50) DEFAULT 'Mixed',
        "QuestionCount" INTEGER DEFAULT 5,
        "CreationTime" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "AiQuizQuestions" (
        "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "AiQuizId" UUID NOT NULL REFERENCES "AiQuizzes"("Id") ON DELETE CASCADE,
        "Content" TEXT NOT NULL,
        "Difficulty" VARCHAR(50) DEFAULT 'Medium',
        "Explanation" TEXT
    );

    CREATE TABLE IF NOT EXISTS "AiQuizChoices" (
        "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "AiQuizQuestionId" UUID NOT NULL REFERENCES "AiQuizQuestions"("Id") ON DELETE CASCADE,
        "Content" TEXT NOT NULL,
        "IsCorrect" BOOLEAN DEFAULT false
    );

    CREATE INDEX IF NOT EXISTS "idx_aiquizzes_creator" ON "AiQuizzes"("CreatorId");
    CREATE INDEX IF NOT EXISTS "idx_aiquizzes_course" ON "AiQuizzes"("CourseId");
    CREATE INDEX IF NOT EXISTS "idx_aiquizzes_lesson" ON "AiQuizzes"("LessonId");
  `;

  try {
    console.log('--- Starting Manual Migration ---');
    const client = await pool.connect();
    console.log('Connected to DB.');
    
    await client.query(sql);
    console.log('SQL Migration executed successfully.');
    
    client.release();
  } catch (err) {
    console.error('Migration failed:', err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    await pool.end();
  }
}

migrate();
