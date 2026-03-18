import pg from 'pg';
const { Client } = pg;

const DB = 'postgresql://postgres.wmiyvcxniyslyweulihf:UfHaPPpBBl25uXUr@aws-1-us-east-1.pooler.supabase.com:6543/postgres';

const client = new Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });

async function run(label, sql) {
  try {
    await client.query(sql);
    console.log('✅', label);
  } catch (e) {
    console.warn('⚠️ ', label, '->', e.message);
  }
}

await client.connect();
console.log('Connected!\n');

// === QuestionBanks ===
await run('CREATE TABLE QuestionBanks', `
  CREATE TABLE IF NOT EXISTS "QuestionBanks" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Name" VARCHAR(255) NOT NULL,
    "Description" VARCHAR(1000),
    "Status" VARCHAR(45) NOT NULL DEFAULT 'Draft',
    "IsPublic" BOOLEAN NOT NULL DEFAULT false,
    "CourseId" UUID NOT NULL,
    "CreatorId" UUID NOT NULL,
    "LastModifierId" UUID NOT NULL,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_QuestionBanks" PRIMARY KEY ("Id")
  )
`);
await run('INDEX IX_QuestionBanks_CourseId', `CREATE INDEX IF NOT EXISTS "IX_QuestionBanks_CourseId"       ON "QuestionBanks"("CourseId")`);
await run('INDEX IX_QuestionBanks_CreatorId', `CREATE INDEX IF NOT EXISTS "IX_QuestionBanks_CreatorId"      ON "QuestionBanks"("CreatorId")`);
await run('INDEX IX_QuestionBanks_LastModifierId', `CREATE INDEX IF NOT EXISTS "IX_QuestionBanks_LastModifierId" ON "QuestionBanks"("LastModifierId")`);
await run('INDEX IX_QuestionBanks_IsPublic', `CREATE INDEX IF NOT EXISTS "IX_QuestionBanks_IsPublic"       ON "QuestionBanks"("IsPublic")`);
await run('INDEX IX_QuestionBanks_Status', `CREATE INDEX IF NOT EXISTS "IX_QuestionBanks_Status"         ON "QuestionBanks"("Status")`);
await run('FK QuestionBanks -> Courses', `ALTER TABLE "QuestionBanks" DROP CONSTRAINT IF EXISTS "FK_QuestionBanks_Courses"`);
await run('FK QuestionBanks -> Courses ADD', `ALTER TABLE "QuestionBanks" ADD CONSTRAINT "FK_QuestionBanks_Courses" FOREIGN KEY ("CourseId") REFERENCES "Courses"("Id") ON DELETE CASCADE ON UPDATE NO ACTION`);
await run('FK QuestionBanks -> Users Creator DROP', `ALTER TABLE "QuestionBanks" DROP CONSTRAINT IF EXISTS "FK_QuestionBanks_Users_Creator"`);
await run('FK QuestionBanks -> Users Creator ADD', `ALTER TABLE "QuestionBanks" ADD CONSTRAINT "FK_QuestionBanks_Users_Creator" FOREIGN KEY ("CreatorId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION`);
await run('FK QuestionBanks -> Users Modifier DROP', `ALTER TABLE "QuestionBanks" DROP CONSTRAINT IF EXISTS "FK_QuestionBanks_Users_LastModifier"`);
await run('FK QuestionBanks -> Users Modifier ADD', `ALTER TABLE "QuestionBanks" ADD CONSTRAINT "FK_QuestionBanks_Users_LastModifier" FOREIGN KEY ("LastModifierId") REFERENCES "Users"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

// === QuestionBankQuestions ===
await run('CREATE TABLE QuestionBankQuestions', `
  CREATE TABLE IF NOT EXISTS "QuestionBankQuestions" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "QuestionBankId" UUID NOT NULL,
    "Content" VARCHAR(500) NOT NULL,
    "Difficulty" VARCHAR(50),
    "ParamA" DOUBLE PRECISION,
    "ParamB" DOUBLE PRECISION,
    "ParamC" DOUBLE PRECISION,
    "Explanation" VARCHAR(2000),
    "Status" VARCHAR(45) NOT NULL DEFAULT 'Draft',
    "CreatorId" UUID NOT NULL,
    "LastModifierId" UUID NOT NULL,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_QuestionBankQuestions" PRIMARY KEY ("Id")
  )
`);
await run('INDEX IX_QBQ_QuestionBankId', `CREATE INDEX IF NOT EXISTS "IX_QuestionBankQuestions_QuestionBankId" ON "QuestionBankQuestions"("QuestionBankId")`);
await run('INDEX IX_QBQ_CreatorId', `CREATE INDEX IF NOT EXISTS "IX_QuestionBankQuestions_CreatorId"      ON "QuestionBankQuestions"("CreatorId")`);
await run('INDEX IX_QBQ_LastModifierId', `CREATE INDEX IF NOT EXISTS "IX_QuestionBankQuestions_LastModifierId" ON "QuestionBankQuestions"("LastModifierId")`);
await run('INDEX IX_QBQ_Status', `CREATE INDEX IF NOT EXISTS "IX_QuestionBankQuestions_Status"         ON "QuestionBankQuestions"("Status")`);
await run('FK QBQ -> QuestionBanks DROP', `ALTER TABLE "QuestionBankQuestions" DROP CONSTRAINT IF EXISTS "FK_QuestionBankQuestions_QuestionBanks"`);
await run('FK QBQ -> QuestionBanks ADD', `ALTER TABLE "QuestionBankQuestions" ADD CONSTRAINT "FK_QuestionBankQuestions_QuestionBanks" FOREIGN KEY ("QuestionBankId") REFERENCES "QuestionBanks"("Id") ON DELETE CASCADE ON UPDATE NO ACTION`);
await run('FK QBQ -> Users Creator DROP', `ALTER TABLE "QuestionBankQuestions" DROP CONSTRAINT IF EXISTS "FK_QuestionBankQuestions_Users_Creator"`);
await run('FK QBQ -> Users Creator ADD', `ALTER TABLE "QuestionBankQuestions" ADD CONSTRAINT "FK_QuestionBankQuestions_Users_Creator" FOREIGN KEY ("CreatorId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION`);
await run('FK QBQ -> Users Modifier DROP', `ALTER TABLE "QuestionBankQuestions" DROP CONSTRAINT IF EXISTS "FK_QuestionBankQuestions_Users_LastModifier"`);
await run('FK QBQ -> Users Modifier ADD', `ALTER TABLE "QuestionBankQuestions" ADD CONSTRAINT "FK_QuestionBankQuestions_Users_LastModifier" FOREIGN KEY ("LastModifierId") REFERENCES "Users"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

// === QuestionBankChoices ===
await run('CREATE TABLE QuestionBankChoices', `
  CREATE TABLE IF NOT EXISTS "QuestionBankChoices" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "QuestionBankQuestionId" UUID NOT NULL,
    "Content" VARCHAR(500) NOT NULL,
    "IsCorrect" BOOLEAN NOT NULL DEFAULT false,
    "OrderIndex" INTEGER NOT NULL DEFAULT 0,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_QuestionBankChoices" PRIMARY KEY ("Id")
  )
`);
await run('INDEX IX_QBC_QBQId_OrderIndex', `CREATE INDEX IF NOT EXISTS "IX_QuestionBankChoices_QuestionBankQuestionId_OrderIndex" ON "QuestionBankChoices"("QuestionBankQuestionId","OrderIndex")`);
await run('INDEX IX_QBC_QBQId', `CREATE INDEX IF NOT EXISTS "IX_QuestionBankChoices_QuestionBankQuestionId"              ON "QuestionBankChoices"("QuestionBankQuestionId")`);
await run('FK QBC -> QBQ DROP', `ALTER TABLE "QuestionBankChoices" DROP CONSTRAINT IF EXISTS "FK_QuestionBankChoices_QuestionBankQuestions"`);
await run('FK QBC -> QBQ ADD', `ALTER TABLE "QuestionBankChoices" ADD CONSTRAINT "FK_QuestionBankChoices_QuestionBankQuestions" FOREIGN KEY ("QuestionBankQuestionId") REFERENCES "QuestionBankQuestions"("Id") ON DELETE CASCADE ON UPDATE NO ACTION`);

// === Thêm cột mới vào bảng hiện có ===
await run('ADD COLUMN Assignments.SourceQuestionBankId', `ALTER TABLE "Assignments"   ADD COLUMN IF NOT EXISTS "SourceQuestionBankId"           UUID`);
await run('ADD COLUMN McqChoices.SourceQuestionBankChoiceId', `ALTER TABLE "McqChoices"    ADD COLUMN IF NOT EXISTS "SourceQuestionBankChoiceId"      UUID`);
await run('ADD COLUMN McqQuestions.SourceQuestionBankQuestionId', `ALTER TABLE "McqQuestions" ADD COLUMN IF NOT EXISTS "SourceQuestionBankQuestionId"  UUID`);

await run('INDEX Assignments.SourceQuestionBankId', `CREATE INDEX IF NOT EXISTS "IX_Assignments_SourceQuestionBankId"          ON "Assignments"("SourceQuestionBankId")`);
await run('INDEX McqChoices.SourceQuestionBankChoiceId', `CREATE INDEX IF NOT EXISTS "IX_McqChoices_SourceQuestionBankChoiceId"     ON "McqChoices"("SourceQuestionBankChoiceId")`);
await run('INDEX McqQuestions.SourceQBQId', `CREATE INDEX IF NOT EXISTS "IX_McqQuestions_SourceQuestionBankQuestionId" ON "McqQuestions"("SourceQuestionBankQuestionId")`);

await run('FK Assignments -> QB DROP', `ALTER TABLE "Assignments" DROP CONSTRAINT IF EXISTS "FK_Assignments_QuestionBanks"`);
await run('FK Assignments -> QB ADD', `ALTER TABLE "Assignments" ADD CONSTRAINT "FK_Assignments_QuestionBanks" FOREIGN KEY ("SourceQuestionBankId") REFERENCES "QuestionBanks"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
await run('FK McqChoices -> QBC DROP', `ALTER TABLE "McqChoices" DROP CONSTRAINT IF EXISTS "FK_McqChoices_QuestionBankChoices"`);
await run('FK McqChoices -> QBC ADD', `ALTER TABLE "McqChoices" ADD CONSTRAINT "FK_McqChoices_QuestionBankChoices" FOREIGN KEY ("SourceQuestionBankChoiceId") REFERENCES "QuestionBankChoices"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
await run('FK McqQuestions -> QBQ DROP', `ALTER TABLE "McqQuestions" DROP CONSTRAINT IF EXISTS "FK_McqQuestions_QuestionBankQuestions"`);
await run('FK McqQuestions -> QBQ ADD', `ALTER TABLE "McqQuestions" ADD CONSTRAINT "FK_McqQuestions_QuestionBankQuestions" FOREIGN KEY ("SourceQuestionBankQuestionId") REFERENCES "QuestionBankQuestions"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

// === Unique constraint ===
await run('UNIQUE UserAbilities (UserId, CourseId)', `
  ALTER TABLE "UserAbilities" ADD CONSTRAINT "UQ_UserAbilities_UserId_CourseId" UNIQUE ("UserId", "CourseId")
`);

console.log('\n=== Migration complete! ===');
await client.end();
