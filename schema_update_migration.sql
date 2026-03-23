-- ============================================================
-- MIGRATION: Cập nhật database theo Prisma Schema mới nhất
-- Ngày: 2026-03-18
-- Chỉ bao gồm những thứ CHƯA CÓ trong database
-- ============================================================

-- ============================================================
-- BƯỚC 1: TẠO BẢNG MỚI
-- ============================================================

-- CreateTable: QuestionBanks
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
);

CREATE INDEX IF NOT EXISTS "IX_QuestionBanks_CourseId" ON "QuestionBanks"("CourseId");
CREATE INDEX IF NOT EXISTS "IX_QuestionBanks_CreatorId" ON "QuestionBanks"("CreatorId");
CREATE INDEX IF NOT EXISTS "IX_QuestionBanks_LastModifierId" ON "QuestionBanks"("LastModifierId");
CREATE INDEX IF NOT EXISTS "IX_QuestionBanks_IsPublic" ON "QuestionBanks"("IsPublic");
CREATE INDEX IF NOT EXISTS "IX_QuestionBanks_Status" ON "QuestionBanks"("Status");

ALTER TABLE "QuestionBanks" DROP CONSTRAINT IF EXISTS "FK_QuestionBanks_Courses";
ALTER TABLE "QuestionBanks" ADD CONSTRAINT "FK_QuestionBanks_Courses" FOREIGN KEY ("CourseId") REFERENCES "Courses"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "QuestionBanks" DROP CONSTRAINT IF EXISTS "FK_QuestionBanks_Users_Creator";
ALTER TABLE "QuestionBanks" ADD CONSTRAINT "FK_QuestionBanks_Users_Creator" FOREIGN KEY ("CreatorId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "QuestionBanks" DROP CONSTRAINT IF EXISTS "FK_QuestionBanks_Users_LastModifier";
ALTER TABLE "QuestionBanks" ADD CONSTRAINT "FK_QuestionBanks_Users_LastModifier" FOREIGN KEY ("LastModifierId") REFERENCES "Users"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;


-- CreateTable: QuestionBankQuestions
CREATE TABLE IF NOT EXISTS "QuestionBankQuestions" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "QuestionBankId" UUID NOT NULL,
    "Content" VARCHAR(500) NOT NULL,
    "Difficulty" VARCHAR(50),
    "ParamA" DOUBLE PRECISION,
    "ParamB" DOUBLE PRECISION,
    "ParamC" DOUBLE PRECISION,
    "Explanation" VARCHAR(2000),`
    "Status" VARCHAR(45) NOT NULL DEFAULT 'Draft',
    "CreatorId" UUID NOT NULL,
    "LastModifierId" UUID NOT NULL,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_QuestionBankQuestions" PRIMARY KEY ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_QuestionBankQuestions_QuestionBankId" ON "QuestionBankQuestions"("QuestionBankId");
CREATE INDEX IF NOT EXISTS "IX_QuestionBankQuestions_CreatorId" ON "QuestionBankQuestions"("CreatorId");
CREATE INDEX IF NOT EXISTS "IX_QuestionBankQuestions_LastModifierId" ON "QuestionBankQuestions"("LastModifierId");
CREATE INDEX IF NOT EXISTS "IX_QuestionBankQuestions_Status" ON "QuestionBankQuestions"("Status");

ALTER TABLE "QuestionBankQuestions" DROP CONSTRAINT IF EXISTS "FK_QuestionBankQuestions_QuestionBanks";
ALTER TABLE "QuestionBankQuestions" ADD CONSTRAINT "FK_QuestionBankQuestions_QuestionBanks" FOREIGN KEY ("QuestionBankId") REFERENCES "QuestionBanks"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "QuestionBankQuestions" DROP CONSTRAINT IF EXISTS "FK_QuestionBankQuestions_Users_Creator";
ALTER TABLE "QuestionBankQuestions" ADD CONSTRAINT "FK_QuestionBankQuestions_Users_Creator" FOREIGN KEY ("CreatorId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "QuestionBankQuestions" DROP CONSTRAINT IF EXISTS "FK_QuestionBankQuestions_Users_LastModifier";
ALTER TABLE "QuestionBankQuestions" ADD CONSTRAINT "FK_QuestionBankQuestions_Users_LastModifier" FOREIGN KEY ("LastModifierId") REFERENCES "Users"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;


-- CreateTable: QuestionBankChoices
CREATE TABLE IF NOT EXISTS "QuestionBankChoices" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "QuestionBankQuestionId" UUID NOT NULL,
    "Content" VARCHAR(500) NOT NULL,
    "IsCorrect" BOOLEAN NOT NULL DEFAULT false,
    "OrderIndex" INTEGER NOT NULL DEFAULT 0,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_QuestionBankChoices" PRIMARY KEY ("Id")
);

CREATE INDEX IF NOT EXISTS "IX_QuestionBankChoices_QuestionBankQuestionId_OrderIndex" ON "QuestionBankChoices"("QuestionBankQuestionId", "OrderIndex");
CREATE INDEX IF NOT EXISTS "IX_QuestionBankChoices_QuestionBankQuestionId" ON "QuestionBankChoices"("QuestionBankQuestionId");

ALTER TABLE "QuestionBankChoices" DROP CONSTRAINT IF EXISTS "FK_QuestionBankChoices_QuestionBankQuestions";
ALTER TABLE "QuestionBankChoices" ADD CONSTRAINT "FK_QuestionBankChoices_QuestionBankQuestions" FOREIGN KEY ("QuestionBankQuestionId") REFERENCES "QuestionBankQuestions"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;


-- ============================================================
-- BƯỚC 2: THÊM CỘT MỚI VÀO BẢNG HIỆN CÓ
-- ============================================================

-- Assignments: thêm SourceQuestionBankId
ALTER TABLE "Assignments" ADD COLUMN IF NOT EXISTS "SourceQuestionBankId" UUID;
CREATE INDEX IF NOT EXISTS "IX_Assignments_SourceQuestionBankId" ON "Assignments"("SourceQuestionBankId");
ALTER TABLE "Assignments" DROP CONSTRAINT IF EXISTS "FK_Assignments_QuestionBanks";
ALTER TABLE "Assignments" ADD CONSTRAINT "FK_Assignments_QuestionBanks" FOREIGN KEY ("SourceQuestionBankId") REFERENCES "QuestionBanks"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- McqChoices: thêm SourceQuestionBankChoiceId
ALTER TABLE "McqChoices" ADD COLUMN IF NOT EXISTS "SourceQuestionBankChoiceId" UUID;
CREATE INDEX IF NOT EXISTS "IX_McqChoices_SourceQuestionBankChoiceId" ON "McqChoices"("SourceQuestionBankChoiceId");
ALTER TABLE "McqChoices" DROP CONSTRAINT IF EXISTS "FK_McqChoices_QuestionBankChoices";
ALTER TABLE "McqChoices" ADD CONSTRAINT "FK_McqChoices_QuestionBankChoices" FOREIGN KEY ("SourceQuestionBankChoiceId") REFERENCES "QuestionBankChoices"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- McqQuestions: thêm SourceQuestionBankQuestionId
ALTER TABLE "McqQuestions" ADD COLUMN IF NOT EXISTS "SourceQuestionBankQuestionId" UUID;
CREATE INDEX IF NOT EXISTS "IX_McqQuestions_SourceQuestionBankQuestionId" ON "McqQuestions"("SourceQuestionBankQuestionId");
ALTER TABLE "McqQuestions" DROP CONSTRAINT IF EXISTS "FK_McqQuestions_QuestionBankQuestions";
ALTER TABLE "McqQuestions" ADD CONSTRAINT "FK_McqQuestions_QuestionBankQuestions" FOREIGN KEY ("SourceQuestionBankQuestionId") REFERENCES "QuestionBankQuestions"("Id") ON DELETE NO ACTION ON UPDATE NO ACTION;


-- ============================================================
-- BƯỚC 3: THÊM UNIQUE CONSTRAINT
-- ============================================================

-- UserAbilities: unique (UserId, CourseId)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UQ_UserAbilities_UserId_CourseId'
    ) THEN
        ALTER TABLE "UserAbilities" ADD CONSTRAINT "UQ_UserAbilities_UserId_CourseId" UNIQUE ("UserId", "CourseId");
    END IF;
END $$;


-- ============================================================
-- XONG!
-- ============================================================
