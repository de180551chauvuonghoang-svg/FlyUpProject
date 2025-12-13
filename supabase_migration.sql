-- =============================================
-- CourseHub Database Migration: SQL Server to Supabase (PostgreSQL)
-- Generated from CourseHubDB 14-11.sql
-- =============================================

-- Enable UUID extension (required for Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- DROP TABLES IF EXISTS (in reverse order of dependencies)
-- =============================================
DROP TABLE IF EXISTS "McqUserAnswer" CASCADE;
DROP TABLE IF EXISTS "McqChoices" CASCADE;
DROP TABLE IF EXISTS "McqQuestions" CASCADE;
DROP TABLE IF EXISTS "Submissions" CASCADE;
DROP TABLE IF EXISTS "LectureCompletions" CASCADE;
DROP TABLE IF EXISTS "LectureMaterial" CASCADE;
DROP TABLE IF EXISTS "Lectures" CASCADE;
DROP TABLE IF EXISTS "AssignmentCompletions" CASCADE;
DROP TABLE IF EXISTS "Assignments" CASCADE;
DROP TABLE IF EXISTS "Sections" CASCADE;
DROP TABLE IF EXISTS "CAT_Results" CASCADE;
DROP TABLE IF EXISTS "CAT_Logs" CASCADE;
DROP TABLE IF EXISTS "UserAbilities" CASCADE;
DROP TABLE IF EXISTS "CourseReviews" CASCADE;
DROP TABLE IF EXISTS "CourseNotifications" CASCADE;
DROP TABLE IF EXISTS "CourseMeta" CASCADE;
DROP TABLE IF EXISTS "Enrollments" CASCADE;
DROP TABLE IF EXISTS "Courses" CASCADE;
DROP TABLE IF EXISTS "Categories" CASCADE;
DROP TABLE IF EXISTS "Instructors" CASCADE;
DROP TABLE IF EXISTS "Tag" CASCADE;
DROP TABLE IF EXISTS "CommentMedia" CASCADE;
DROP TABLE IF EXISTS "Comments" CASCADE;
DROP TABLE IF EXISTS "Reactions" CASCADE;
DROP TABLE IF EXISTS "Articles" CASCADE;
DROP TABLE IF EXISTS "ChatMessages" CASCADE;
DROP TABLE IF EXISTS "ConversationMembers" CASCADE;
DROP TABLE IF EXISTS "Conversations" CASCADE;
DROP TABLE IF EXISTS "PrivateMessages" CASCADE;
DROP TABLE IF EXISTS "PrivateConversations" CASCADE;
DROP TABLE IF EXISTS "Notifications" CASCADE;
DROP TABLE IF EXISTS "Bills" CASCADE;
DROP TABLE IF EXISTS "CartCheckout" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;
DROP TABLE IF EXISTS "__EFMigrationsHistory" CASCADE;

-- =============================================
-- TABLE: __EFMigrationsHistory
-- =============================================
CREATE TABLE "__EFMigrationsHistory" (
    "MigrationId" VARCHAR(150) NOT NULL,
    "ProductVersion" VARCHAR(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

-- =============================================
-- TABLE: Users
-- =============================================
CREATE TABLE "Users" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "UserName" VARCHAR(45) NOT NULL,
    "Password" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(45) NOT NULL,
    "FullName" VARCHAR(45) NOT NULL,
    "MetaFullName" VARCHAR(45) NOT NULL,
    "AvatarUrl" VARCHAR(100) NOT NULL,
    "Role" TEXT NOT NULL,
    "Token" VARCHAR(100) NOT NULL,
    "RefreshToken" VARCHAR(100) NOT NULL,
    "IsVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    "IsApproved" BOOLEAN NOT NULL DEFAULT FALSE,
    "AccessFailedCount" SMALLINT NOT NULL DEFAULT 0,
    "LoginProvider" VARCHAR(100),
    "ProviderKey" VARCHAR(100),
    "Bio" VARCHAR(1000) NOT NULL DEFAULT '',
    "DateOfBirth" TIMESTAMP,
    "Phone" VARCHAR(45),
    "EnrollmentCount" INTEGER NOT NULL DEFAULT 0,
    "InstructorId" UUID,
    "CreationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "SystemBalance" BIGINT NOT NULL DEFAULT 0,
    "avatar_url" VARCHAR(255),
    "last_seen" TIMESTAMP,
    CONSTRAINT "PK_Users" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: Instructors
-- =============================================
CREATE TABLE "Instructors" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Intro" VARCHAR(500) NOT NULL DEFAULT '',
    "Experience" VARCHAR(1000) NOT NULL DEFAULT '',
    "CreatorId" UUID NOT NULL,
    "CreationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Balance" BIGINT NOT NULL DEFAULT 0,
    "CourseCount" SMALLINT NOT NULL DEFAULT 0,
    CONSTRAINT "PK_Instructors" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: Categories
-- =============================================
CREATE TABLE "Categories" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Path" VARCHAR(255) NOT NULL,
    "Title" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(1000) NOT NULL DEFAULT '',
    "IsLeaf" BOOLEAN NOT NULL DEFAULT FALSE,
    "CourseCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PK_Categories" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: Courses
-- =============================================
CREATE TABLE "Courses" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Title" VARCHAR(255) NOT NULL,
    "MetaTitle" VARCHAR(255) NOT NULL,
    "ThumbUrl" VARCHAR(255) NOT NULL DEFAULT '',
    "Intro" VARCHAR(500) NOT NULL DEFAULT '',
    "Description" VARCHAR(1000) NOT NULL DEFAULT '',
    "Status" TEXT NOT NULL DEFAULT 'Draft',
    "Price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "Discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "DiscountExpiry" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Level" TEXT NOT NULL DEFAULT 'Beginner',
    "Outcomes" VARCHAR(500) NOT NULL DEFAULT '',
    "Requirements" VARCHAR(500) NOT NULL DEFAULT '',
    "LectureCount" SMALLINT NOT NULL DEFAULT 0,
    "LearnerCount" INTEGER NOT NULL DEFAULT 0,
    "RatingCount" INTEGER NOT NULL DEFAULT 0,
    "TotalRating" BIGINT NOT NULL DEFAULT 0,
    "LeafCategoryId" UUID NOT NULL,
    "InstructorId" UUID NOT NULL,
    "CreationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatorId" UUID NOT NULL,
    "LastModifierId" UUID NOT NULL,
    "DismissReason" VARCHAR(1000),
    "RejectionReason" VARCHAR(1000),
    "ApprovalStatus" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    CONSTRAINT "PK_Courses" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: Sections
-- =============================================
CREATE TABLE "Sections" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Index" SMALLINT NOT NULL DEFAULT 0,
    "Title" VARCHAR(255) NOT NULL,
    "LectureCount" SMALLINT NOT NULL DEFAULT 0,
    "CourseId" UUID NOT NULL,
    "CreationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_Sections" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: Lectures
-- =============================================
CREATE TABLE "Lectures" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Title" VARCHAR(255) NOT NULL,
    "Content" VARCHAR(3000) NOT NULL DEFAULT '',
    "SectionId" UUID NOT NULL,
    "CreationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "IsPreviewable" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "PK_Lectures" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: LectureMaterial
-- =============================================
CREATE TABLE "LectureMaterial" (
    "LectureId" UUID NOT NULL,
    "Id" SERIAL,
    "Type" TEXT NOT NULL,
    "Url" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_LectureMaterial" PRIMARY KEY ("LectureId", "Id")
);

-- =============================================
-- TABLE: LectureCompletions
-- =============================================
CREATE TABLE "LectureCompletions" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL,
    "LectureId" UUID NOT NULL,
    "CompletedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_LectureCompletions" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: Assignments
-- =============================================
CREATE TABLE "Assignments" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Name" VARCHAR(255) NOT NULL,
    "Duration" INTEGER NOT NULL DEFAULT 30,
    "QuestionCount" INTEGER NOT NULL DEFAULT 0,
    "SectionId" UUID NOT NULL,
    "CreatorId" UUID NOT NULL,
    "GradeToPass" DOUBLE PRECISION NOT NULL DEFAULT 8,
    CONSTRAINT "PK_Assignments" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: AssignmentCompletions
-- =============================================
CREATE TABLE "AssignmentCompletions" (
    "Id" BIGSERIAL NOT NULL,
    "UserId" UUID NOT NULL,
    "AssignmentId" UUID NOT NULL,
    "CompletedDate" TIMESTAMP,
    CONSTRAINT "PK_AssignmentCompletions" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: McqQuestions
-- =============================================
CREATE TABLE "McqQuestions" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Content" VARCHAR(500) NOT NULL,
    "AssignmentId" UUID NOT NULL,
    "ParamA" DOUBLE PRECISION,
    "ParamB" DOUBLE PRECISION,
    "ParamC" DOUBLE PRECISION,
    "Difficulty" VARCHAR(50),
    CONSTRAINT "PK_McqQuestions" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: McqChoices
-- =============================================
CREATE TABLE "McqChoices" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Content" TEXT,
    "IsCorrect" BOOLEAN NOT NULL DEFAULT FALSE,
    "McqQuestionId" UUID,
    CONSTRAINT "PK_McqChoices" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: Submissions
-- =============================================
CREATE TABLE "Submissions" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Mark" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "TimeSpentInSec" INTEGER NOT NULL DEFAULT 0,
    "AssignmentId" UUID NOT NULL,
    "CreationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatorId" UUID NOT NULL,
    "LastModifierId" UUID NOT NULL,
    CONSTRAINT "PK_Submissions" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: McqUserAnswer
-- =============================================
CREATE TABLE "McqUserAnswer" (
    "SubmissionId" UUID NOT NULL,
    "MCQChoiceId" UUID NOT NULL,
    CONSTRAINT "PK_McqUserAnswer" PRIMARY KEY ("SubmissionId", "MCQChoiceId")
);

-- =============================================
-- TABLE: Enrollments
-- =============================================
CREATE TABLE "Enrollments" (
    "CreatorId" UUID NOT NULL,
    "CourseId" UUID NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'Active',
    "BillId" UUID,
    "CreationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "AssignmentMilestones" TEXT NOT NULL DEFAULT '[]',
    "LectureMilestones" TEXT NOT NULL DEFAULT '[]',
    "SectionMilestones" TEXT NOT NULL DEFAULT '[]',
    "LastViewedLectureId" UUID,
    CONSTRAINT "PK_Enrollments" PRIMARY KEY ("CreatorId", "CourseId")
);

-- =============================================
-- TABLE: CourseReviews
-- =============================================
CREATE TABLE "CourseReviews" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Content" VARCHAR(500) NOT NULL DEFAULT '',
    "Rating" SMALLINT NOT NULL DEFAULT 5,
    "CourseId" UUID NOT NULL,
    "CreationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatorId" UUID NOT NULL,
    "LastModifierId" UUID NOT NULL,
    CONSTRAINT "PK_CourseReviews" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: CourseMeta
-- =============================================
CREATE TABLE "CourseMeta" (
    "CourseId" UUID NOT NULL,
    "Id" SERIAL,
    "Type" SMALLINT NOT NULL DEFAULT 0,
    "Value" VARCHAR(100) NOT NULL DEFAULT '',
    CONSTRAINT "PK_CourseMeta" PRIMARY KEY ("CourseId", "Id")
);

-- =============================================
-- TABLE: CourseNotifications
-- =============================================
CREATE TABLE "CourseNotifications" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "CourseId" UUID NOT NULL,
    "InstructorId" UUID NOT NULL,
    "InstructorName" VARCHAR(255) NOT NULL,
    "CourseTitle" VARCHAR(255) NOT NULL,
    "CoursePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "NotificationType" VARCHAR(50) NOT NULL,
    "Status" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "RejectionReason" VARCHAR(1000),
    "CreationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ProcessedTime" TIMESTAMP,
    "ProcessedBy" UUID,
    CONSTRAINT "PK_CourseNotifications" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: Articles
-- =============================================
CREATE TABLE "Articles" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Content" VARCHAR(3000) NOT NULL,
    "Title" VARCHAR(255) NOT NULL,
    "Status" VARCHAR(45) NOT NULL DEFAULT 'Draft',
    "IsCommentDisabled" BOOLEAN NOT NULL DEFAULT FALSE,
    "CommentCount" INTEGER NOT NULL DEFAULT 0,
    "ViewCount" INTEGER NOT NULL DEFAULT 0,
    "CreationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatorId" UUID NOT NULL,
    "LastModifierId" UUID NOT NULL,
    CONSTRAINT "PK_Articles" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: Tag
-- =============================================
CREATE TABLE "Tag" (
    "ArticleId" UUID NOT NULL,
    "Id" SERIAL,
    "Title" VARCHAR(45) NOT NULL,
    CONSTRAINT "PK_Tag" PRIMARY KEY ("ArticleId", "Id")
);

-- =============================================
-- TABLE: Comments
-- =============================================
CREATE TABLE "Comments" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Content" VARCHAR(500) NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'Active',
    "SourceType" TEXT NOT NULL,
    "ParentId" UUID,
    "LectureId" UUID,
    "ArticleId" UUID,
    "CreationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatorId" UUID NOT NULL,
    "LastModifierId" UUID NOT NULL,
    CONSTRAINT "PK_Comments" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: CommentMedia
-- =============================================
CREATE TABLE "CommentMedia" (
    "CommentId" UUID NOT NULL,
    "Id" SERIAL,
    "Type" TEXT NOT NULL,
    "Url" VARCHAR(255) NOT NULL,
    CONSTRAINT "PK_CommentMedia" PRIMARY KEY ("CommentId", "Id")
);

-- =============================================
-- TABLE: Reactions
-- =============================================
CREATE TABLE "Reactions" (
    "CreatorId" UUID NOT NULL,
    "SourceEntityId" UUID NOT NULL,
    "Content" VARCHAR(10) NOT NULL,
    "SourceType" TEXT NOT NULL,
    "ArticleId" UUID,
    "ChatMessageId" UUID,
    "CommentId" UUID,
    "CreationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_Reactions" PRIMARY KEY ("CreatorId", "SourceEntityId")
);

-- =============================================
-- TABLE: Conversations
-- =============================================
CREATE TABLE "Conversations" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Title" VARCHAR(45) NOT NULL DEFAULT '',
    "IsPrivate" BOOLEAN NOT NULL DEFAULT FALSE,
    "AvatarUrl" VARCHAR(255) NOT NULL DEFAULT '',
    "CreationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatorId" UUID NOT NULL,
    "last_message_at" TIMESTAMP,
    "is_group" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "PK_Conversations" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: ConversationMembers
-- =============================================
CREATE TABLE "ConversationMembers" (
    "CreatorId" UUID NOT NULL,
    "ConversationId" UUID NOT NULL,
    "IsAdmin" BOOLEAN NOT NULL DEFAULT FALSE,
    "LastVisit" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PK_ConversationMembers" PRIMARY KEY ("CreatorId", "ConversationId")
);

-- =============================================
-- TABLE: ChatMessages
-- =============================================
CREATE TABLE "ChatMessages" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Content" VARCHAR(255) NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'Sent',
    "ConversationId" UUID NOT NULL,
    "CreationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatorId" UUID NOT NULL,
    "LastModifierId" UUID NOT NULL,
    "message_type" VARCHAR(20) NOT NULL DEFAULT 'text',
    "is_edited" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "PK_ChatMessages" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: PrivateConversations
-- =============================================
CREATE TABLE "PrivateConversations" (
    "conversation_id" SERIAL NOT NULL,
    "user1_id" VARCHAR(50) NOT NULL,
    "user2_id" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_at" TIMESTAMP,
    "last_message_text" TEXT,
    CONSTRAINT "PK_PrivateConversations" PRIMARY KEY ("conversation_id")
);

-- =============================================
-- TABLE: PrivateMessages
-- =============================================
CREATE TABLE "PrivateMessages" (
    "message_id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "sender_id" VARCHAR(50) NOT NULL,
    "message_text" TEXT NOT NULL,
    "sent_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT "PK_PrivateMessages" PRIMARY KEY ("message_id")
);

-- =============================================
-- TABLE: Notifications
-- =============================================
CREATE TABLE "Notifications" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Message" VARCHAR(255) NOT NULL,
    "Type" TEXT NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'Unread',
    "ReceiverId" UUID,
    "CreationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatorId" UUID NOT NULL,
    CONSTRAINT "PK_Notifications" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: Bills
-- =============================================
CREATE TABLE "Bills" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Action" VARCHAR(100) NOT NULL,
    "Note" VARCHAR(255) NOT NULL DEFAULT '',
    "Amount" BIGINT NOT NULL DEFAULT 0,
    "Gateway" VARCHAR(20) NOT NULL,
    "TransactionId" VARCHAR(100) NOT NULL DEFAULT '',
    "ClientTransactionId" VARCHAR(100) NOT NULL DEFAULT '',
    "Token" VARCHAR(100) NOT NULL DEFAULT '',
    "IsSuccessful" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatorId" UUID NOT NULL,
    CONSTRAINT "PK_Bills" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: CartCheckout
-- =============================================
CREATE TABLE "CartCheckout" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL,
    "CourseIds" TEXT NOT NULL DEFAULT '[]',
    "TotalAmount" BIGINT NOT NULL DEFAULT 0,
    "PaymentMethod" VARCHAR(20) NOT NULL,
    "Status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "CreationTime" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ProcessedTime" TIMESTAMP,
    "Notes" VARCHAR(500),
    "SessionId" VARCHAR(100),
    CONSTRAINT "PK_CartCheckout" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: UserAbilities (CAT - Computerized Adaptive Testing)
-- =============================================
CREATE TABLE "UserAbilities" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL,
    "CourseId" UUID NOT NULL,
    "Theta" DOUBLE PRECISION,
    "LastUpdate" TIMESTAMP,
    CONSTRAINT "PK_UserAbilities" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: CAT_Logs
-- =============================================
CREATE TABLE "CAT_Logs" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "UserId" UUID,
    "QuestionId" UUID,
    "Response" BOOLEAN,
    "ThetaBefore" DOUBLE PRECISION,
    "ThetaAfter" DOUBLE PRECISION,
    "Timestamp" TIMESTAMP,
    "CourseId" UUID,
    "AssignmentId" UUID,
    CONSTRAINT "PK_CAT_Logs" PRIMARY KEY ("Id")
);

-- =============================================
-- TABLE: CAT_Results
-- =============================================
CREATE TABLE "CAT_Results" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL,
    "CourseId" UUID NOT NULL,
    "AssignmentId" UUID,
    "FinalTheta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "CorrectCount" INTEGER NOT NULL DEFAULT 0,
    "TotalQuestions" INTEGER NOT NULL DEFAULT 0,
    "CompletionTime" TIMESTAMP,
    "ThetaBefore" DOUBLE PRECISION,
    "ThetaAfter" DOUBLE PRECISION,
    CONSTRAINT "PK_CAT_Results" PRIMARY KEY ("Id")
);

-- =============================================
-- FOREIGN KEY CONSTRAINTS
-- =============================================

-- Users -> Instructors
ALTER TABLE "Users"
    ADD CONSTRAINT "FK_Users_Instructors" FOREIGN KEY ("InstructorId")
    REFERENCES "Instructors" ("Id") ON DELETE SET NULL;

-- Instructors -> Users
ALTER TABLE "Instructors"
    ADD CONSTRAINT "FK_Instructors_Users" FOREIGN KEY ("CreatorId")
    REFERENCES "Users" ("Id") ON DELETE CASCADE;

-- Courses -> Categories
ALTER TABLE "Courses"
    ADD CONSTRAINT "FK_Courses_Categories" FOREIGN KEY ("LeafCategoryId")
    REFERENCES "Categories" ("Id") ON DELETE RESTRICT;

-- Courses -> Instructors
ALTER TABLE "Courses"
    ADD CONSTRAINT "FK_Courses_Instructors" FOREIGN KEY ("InstructorId")
    REFERENCES "Instructors" ("Id") ON DELETE RESTRICT;

-- Courses -> Users (Creator)
ALTER TABLE "Courses"
    ADD CONSTRAINT "FK_Courses_Users_Creator" FOREIGN KEY ("CreatorId")
    REFERENCES "Users" ("Id") ON DELETE RESTRICT;

-- Sections -> Courses
ALTER TABLE "Sections"
    ADD CONSTRAINT "FK_Sections_Courses" FOREIGN KEY ("CourseId")
    REFERENCES "Courses" ("Id") ON DELETE CASCADE;

-- Lectures -> Sections
ALTER TABLE "Lectures"
    ADD CONSTRAINT "FK_Lectures_Sections" FOREIGN KEY ("SectionId")
    REFERENCES "Sections" ("Id") ON DELETE CASCADE;

-- LectureMaterial -> Lectures
ALTER TABLE "LectureMaterial"
    ADD CONSTRAINT "FK_LectureMaterial_Lectures" FOREIGN KEY ("LectureId")
    REFERENCES "Lectures" ("Id") ON DELETE CASCADE;

-- LectureCompletions -> Users
ALTER TABLE "LectureCompletions"
    ADD CONSTRAINT "FK_LectureCompletions_Users" FOREIGN KEY ("UserId")
    REFERENCES "Users" ("Id") ON DELETE CASCADE;

-- LectureCompletions -> Lectures
ALTER TABLE "LectureCompletions"
    ADD CONSTRAINT "FK_LectureCompletions_Lectures" FOREIGN KEY ("LectureId")
    REFERENCES "Lectures" ("Id") ON DELETE CASCADE;

-- Assignments -> Sections
ALTER TABLE "Assignments"
    ADD CONSTRAINT "FK_Assignments_Sections" FOREIGN KEY ("SectionId")
    REFERENCES "Sections" ("Id") ON DELETE CASCADE;

-- Assignments -> Users (Creator)
ALTER TABLE "Assignments"
    ADD CONSTRAINT "FK_Assignments_Users" FOREIGN KEY ("CreatorId")
    REFERENCES "Users" ("Id") ON DELETE RESTRICT;

-- AssignmentCompletions -> Users
ALTER TABLE "AssignmentCompletions"
    ADD CONSTRAINT "FK_AssignmentCompletions_Users" FOREIGN KEY ("UserId")
    REFERENCES "Users" ("Id") ON DELETE CASCADE;

-- AssignmentCompletions -> Assignments
ALTER TABLE "AssignmentCompletions"
    ADD CONSTRAINT "FK_AssignmentCompletions_Assignments" FOREIGN KEY ("AssignmentId")
    REFERENCES "Assignments" ("Id") ON DELETE CASCADE;

-- McqQuestions -> Assignments
ALTER TABLE "McqQuestions"
    ADD CONSTRAINT "FK_McqQuestions_Assignments" FOREIGN KEY ("AssignmentId")
    REFERENCES "Assignments" ("Id") ON DELETE CASCADE;

-- McqChoices -> McqQuestions
ALTER TABLE "McqChoices"
    ADD CONSTRAINT "FK_McqChoices_McqQuestions" FOREIGN KEY ("McqQuestionId")
    REFERENCES "McqQuestions" ("Id") ON DELETE CASCADE;

-- Submissions -> Assignments
ALTER TABLE "Submissions"
    ADD CONSTRAINT "FK_Submissions_Assignments" FOREIGN KEY ("AssignmentId")
    REFERENCES "Assignments" ("Id") ON DELETE CASCADE;

-- Submissions -> Users (Creator)
ALTER TABLE "Submissions"
    ADD CONSTRAINT "FK_Submissions_Users" FOREIGN KEY ("CreatorId")
    REFERENCES "Users" ("Id") ON DELETE RESTRICT;

-- McqUserAnswer -> Submissions
ALTER TABLE "McqUserAnswer"
    ADD CONSTRAINT "FK_McqUserAnswer_Submissions" FOREIGN KEY ("SubmissionId")
    REFERENCES "Submissions" ("Id") ON DELETE CASCADE;

-- McqUserAnswer -> McqChoices
ALTER TABLE "McqUserAnswer"
    ADD CONSTRAINT "FK_McqUserAnswer_McqChoices" FOREIGN KEY ("MCQChoiceId")
    REFERENCES "McqChoices" ("Id") ON DELETE CASCADE;

-- Enrollments -> Users
ALTER TABLE "Enrollments"
    ADD CONSTRAINT "FK_Enrollments_Users" FOREIGN KEY ("CreatorId")
    REFERENCES "Users" ("Id") ON DELETE CASCADE;

-- Enrollments -> Courses
ALTER TABLE "Enrollments"
    ADD CONSTRAINT "FK_Enrollments_Courses" FOREIGN KEY ("CourseId")
    REFERENCES "Courses" ("Id") ON DELETE CASCADE;

-- Enrollments -> Bills
ALTER TABLE "Enrollments"
    ADD CONSTRAINT "FK_Enrollments_Bills" FOREIGN KEY ("BillId")
    REFERENCES "Bills" ("Id") ON DELETE SET NULL;

-- Enrollments -> Lectures (LastViewed)
ALTER TABLE "Enrollments"
    ADD CONSTRAINT "FK_Enrollments_Lectures" FOREIGN KEY ("LastViewedLectureId")
    REFERENCES "Lectures" ("Id") ON DELETE SET NULL;

-- CourseReviews -> Courses
ALTER TABLE "CourseReviews"
    ADD CONSTRAINT "FK_CourseReviews_Courses" FOREIGN KEY ("CourseId")
    REFERENCES "Courses" ("Id") ON DELETE CASCADE;

-- CourseReviews -> Users
ALTER TABLE "CourseReviews"
    ADD CONSTRAINT "FK_CourseReviews_Users" FOREIGN KEY ("CreatorId")
    REFERENCES "Users" ("Id") ON DELETE CASCADE;

-- CourseMeta -> Courses
ALTER TABLE "CourseMeta"
    ADD CONSTRAINT "FK_CourseMeta_Courses" FOREIGN KEY ("CourseId")
    REFERENCES "Courses" ("Id") ON DELETE CASCADE;

-- CourseNotifications -> Courses
ALTER TABLE "CourseNotifications"
    ADD CONSTRAINT "FK_CourseNotifications_Courses" FOREIGN KEY ("CourseId")
    REFERENCES "Courses" ("Id") ON DELETE CASCADE;

-- CourseNotifications -> Instructors
ALTER TABLE "CourseNotifications"
    ADD CONSTRAINT "FK_CourseNotifications_Instructors" FOREIGN KEY ("InstructorId")
    REFERENCES "Instructors" ("Id") ON DELETE CASCADE;

-- Articles -> Users (Creator)
ALTER TABLE "Articles"
    ADD CONSTRAINT "FK_Articles_Users" FOREIGN KEY ("CreatorId")
    REFERENCES "Users" ("Id") ON DELETE CASCADE;

-- Tag -> Articles
ALTER TABLE "Tag"
    ADD CONSTRAINT "FK_Tag_Articles" FOREIGN KEY ("ArticleId")
    REFERENCES "Articles" ("Id") ON DELETE CASCADE;

-- Comments -> Users
ALTER TABLE "Comments"
    ADD CONSTRAINT "FK_Comments_Users" FOREIGN KEY ("CreatorId")
    REFERENCES "Users" ("Id") ON DELETE CASCADE;

-- Comments -> Lectures
ALTER TABLE "Comments"
    ADD CONSTRAINT "FK_Comments_Lectures" FOREIGN KEY ("LectureId")
    REFERENCES "Lectures" ("Id") ON DELETE SET NULL;

-- Comments -> Articles
ALTER TABLE "Comments"
    ADD CONSTRAINT "FK_Comments_Articles" FOREIGN KEY ("ArticleId")
    REFERENCES "Articles" ("Id") ON DELETE SET NULL;

-- Comments -> Comments (Parent)
ALTER TABLE "Comments"
    ADD CONSTRAINT "FK_Comments_Comments" FOREIGN KEY ("ParentId")
    REFERENCES "Comments" ("Id") ON DELETE SET NULL;

-- CommentMedia -> Comments
ALTER TABLE "CommentMedia"
    ADD CONSTRAINT "FK_CommentMedia_Comments" FOREIGN KEY ("CommentId")
    REFERENCES "Comments" ("Id") ON DELETE CASCADE;

-- Reactions -> Users
ALTER TABLE "Reactions"
    ADD CONSTRAINT "FK_Reactions_Users" FOREIGN KEY ("CreatorId")
    REFERENCES "Users" ("Id") ON DELETE CASCADE;

-- Reactions -> Articles
ALTER TABLE "Reactions"
    ADD CONSTRAINT "FK_Reactions_Articles" FOREIGN KEY ("ArticleId")
    REFERENCES "Articles" ("Id") ON DELETE SET NULL;

-- Reactions -> ChatMessages
ALTER TABLE "Reactions"
    ADD CONSTRAINT "FK_Reactions_ChatMessages" FOREIGN KEY ("ChatMessageId")
    REFERENCES "ChatMessages" ("Id") ON DELETE SET NULL;

-- Reactions -> Comments
ALTER TABLE "Reactions"
    ADD CONSTRAINT "FK_Reactions_Comments" FOREIGN KEY ("CommentId")
    REFERENCES "Comments" ("Id") ON DELETE SET NULL;

-- Conversations -> Users
ALTER TABLE "Conversations"
    ADD CONSTRAINT "FK_Conversations_Users" FOREIGN KEY ("CreatorId")
    REFERENCES "Users" ("Id") ON DELETE CASCADE;

-- ConversationMembers -> Users
ALTER TABLE "ConversationMembers"
    ADD CONSTRAINT "FK_ConversationMembers_Users" FOREIGN KEY ("CreatorId")
    REFERENCES "Users" ("Id") ON DELETE CASCADE;

-- ConversationMembers -> Conversations
ALTER TABLE "ConversationMembers"
    ADD CONSTRAINT "FK_ConversationMembers_Conversations" FOREIGN KEY ("ConversationId")
    REFERENCES "Conversations" ("Id") ON DELETE CASCADE;

-- ChatMessages -> Conversations
ALTER TABLE "ChatMessages"
    ADD CONSTRAINT "FK_ChatMessages_Conversations" FOREIGN KEY ("ConversationId")
    REFERENCES "Conversations" ("Id") ON DELETE CASCADE;

-- ChatMessages -> Users
ALTER TABLE "ChatMessages"
    ADD CONSTRAINT "FK_ChatMessages_Users" FOREIGN KEY ("CreatorId")
    REFERENCES "Users" ("Id") ON DELETE CASCADE;

-- PrivateMessages -> PrivateConversations
ALTER TABLE "PrivateMessages"
    ADD CONSTRAINT "FK_PrivateMessages_PrivateConversations" FOREIGN KEY ("conversation_id")
    REFERENCES "PrivateConversations" ("conversation_id") ON DELETE CASCADE;

-- Notifications -> Users (Receiver)
ALTER TABLE "Notifications"
    ADD CONSTRAINT "FK_Notifications_Users_Receiver" FOREIGN KEY ("ReceiverId")
    REFERENCES "Users" ("Id") ON DELETE SET NULL;

-- Notifications -> Users (Creator)
ALTER TABLE "Notifications"
    ADD CONSTRAINT "FK_Notifications_Users_Creator" FOREIGN KEY ("CreatorId")
    REFERENCES "Users" ("Id") ON DELETE CASCADE;

-- Bills -> Users
ALTER TABLE "Bills"
    ADD CONSTRAINT "FK_Bills_Users" FOREIGN KEY ("CreatorId")
    REFERENCES "Users" ("Id") ON DELETE CASCADE;

-- CartCheckout -> Users
ALTER TABLE "CartCheckout"
    ADD CONSTRAINT "FK_CartCheckout_Users" FOREIGN KEY ("UserId")
    REFERENCES "Users" ("Id") ON DELETE CASCADE;

-- UserAbilities -> Users
ALTER TABLE "UserAbilities"
    ADD CONSTRAINT "FK_UserAbilities_Users" FOREIGN KEY ("UserId")
    REFERENCES "Users" ("Id") ON DELETE CASCADE;

-- UserAbilities -> Courses
ALTER TABLE "UserAbilities"
    ADD CONSTRAINT "FK_UserAbilities_Courses" FOREIGN KEY ("CourseId")
    REFERENCES "Courses" ("Id") ON DELETE CASCADE;

-- CAT_Logs -> Users
ALTER TABLE "CAT_Logs"
    ADD CONSTRAINT "FK_CAT_Logs_Users" FOREIGN KEY ("UserId")
    REFERENCES "Users" ("Id") ON DELETE SET NULL;

-- CAT_Logs -> McqQuestions
ALTER TABLE "CAT_Logs"
    ADD CONSTRAINT "FK_CAT_Logs_McqQuestions" FOREIGN KEY ("QuestionId")
    REFERENCES "McqQuestions" ("Id") ON DELETE SET NULL;

-- CAT_Logs -> Courses
ALTER TABLE "CAT_Logs"
    ADD CONSTRAINT "FK_CAT_Logs_Courses" FOREIGN KEY ("CourseId")
    REFERENCES "Courses" ("Id") ON DELETE SET NULL;

-- CAT_Logs -> Assignments
ALTER TABLE "CAT_Logs"
    ADD CONSTRAINT "FK_CAT_Logs_Assignments" FOREIGN KEY ("AssignmentId")
    REFERENCES "Assignments" ("Id") ON DELETE SET NULL;

-- CAT_Results -> Users
ALTER TABLE "CAT_Results"
    ADD CONSTRAINT "FK_CAT_Results_Users" FOREIGN KEY ("UserId")
    REFERENCES "Users" ("Id") ON DELETE CASCADE;

-- CAT_Results -> Courses
ALTER TABLE "CAT_Results"
    ADD CONSTRAINT "FK_CAT_Results_Courses" FOREIGN KEY ("CourseId")
    REFERENCES "Courses" ("Id") ON DELETE CASCADE;

-- CAT_Results -> Assignments
ALTER TABLE "CAT_Results"
    ADD CONSTRAINT "FK_CAT_Results_Assignments" FOREIGN KEY ("AssignmentId")
    REFERENCES "Assignments" ("Id") ON DELETE SET NULL;

-- =============================================
-- INDEXES
-- =============================================

-- Users indexes
CREATE INDEX "IX_Users_Email" ON "Users" ("Email");
CREATE INDEX "IX_Users_UserName" ON "Users" ("UserName");
CREATE INDEX "IX_Users_InstructorId" ON "Users" ("InstructorId");

-- Courses indexes
CREATE INDEX "IX_Courses_LeafCategoryId" ON "Courses" ("LeafCategoryId");
CREATE INDEX "IX_Courses_InstructorId" ON "Courses" ("InstructorId");
CREATE INDEX "IX_Courses_Status" ON "Courses" ("Status");

-- Sections indexes
CREATE INDEX "IX_Sections_CourseId" ON "Sections" ("CourseId");

-- Lectures indexes
CREATE INDEX "IX_Lectures_SectionId" ON "Lectures" ("SectionId");

-- Assignments indexes
CREATE INDEX "IX_Assignments_SectionId" ON "Assignments" ("SectionId");

-- McqQuestions indexes
CREATE INDEX "IX_McqQuestions_AssignmentId" ON "McqQuestions" ("AssignmentId");

-- McqChoices indexes
CREATE INDEX "IX_McqChoices_McqQuestionId" ON "McqChoices" ("McqQuestionId");

-- Enrollments indexes
CREATE INDEX "IX_Enrollments_CourseId" ON "Enrollments" ("CourseId");
CREATE INDEX "IX_Enrollments_CreatorId" ON "Enrollments" ("CreatorId");

-- CourseReviews indexes
CREATE INDEX "IX_CourseReviews_CourseId" ON "CourseReviews" ("CourseId");

-- Comments indexes
CREATE INDEX "IX_Comments_LectureId" ON "Comments" ("LectureId");
CREATE INDEX "IX_Comments_ArticleId" ON "Comments" ("ArticleId");
CREATE INDEX "IX_Comments_ParentId" ON "Comments" ("ParentId");

-- ChatMessages indexes
CREATE INDEX "IX_ChatMessages_ConversationId" ON "ChatMessages" ("ConversationId");

-- Notifications indexes
CREATE INDEX "IX_Notifications_ReceiverId" ON "Notifications" ("ReceiverId");

-- Bills indexes
CREATE INDEX "IX_Bills_CreatorId" ON "Bills" ("CreatorId");

-- CartCheckout indexes
CREATE INDEX "IX_CartCheckout_UserId" ON "CartCheckout" ("UserId");
CREATE INDEX "IX_CartCheckout_Status" ON "CartCheckout" ("Status");

-- CAT indexes
CREATE INDEX "IX_CAT_Logs_UserId" ON "CAT_Logs" ("UserId");
CREATE INDEX "IX_CAT_Logs_CourseId" ON "CAT_Logs" ("CourseId");
CREATE INDEX "IX_CAT_Results_UserId" ON "CAT_Results" ("UserId");
CREATE INDEX "IX_CAT_Results_CourseId" ON "CAT_Results" ("CourseId");
CREATE INDEX "IX_UserAbilities_UserId" ON "UserAbilities" ("UserId");
CREATE INDEX "IX_UserAbilities_CourseId" ON "UserAbilities" ("CourseId");

-- =============================================
-- FUNCTION: GetCheckoutStats (converted from SQL Server)
-- =============================================
CREATE OR REPLACE FUNCTION get_checkout_stats(from_date TIMESTAMP, to_date TIMESTAMP)
RETURNS TABLE (
    total_checkouts BIGINT,
    completed_checkouts BIGINT,
    failed_checkouts BIGINT,
    cod_checkouts BIGINT,
    online_checkouts BIGINT,
    total_revenue NUMERIC,
    avg_order_value NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT AS total_checkouts,
        SUM(CASE WHEN "Status" = 'COMPLETED' THEN 1 ELSE 0 END)::BIGINT AS completed_checkouts,
        SUM(CASE WHEN "Status" = 'FAILED' THEN 1 ELSE 0 END)::BIGINT AS failed_checkouts,
        SUM(CASE WHEN "PaymentMethod" = 'COD' THEN 1 ELSE 0 END)::BIGINT AS cod_checkouts,
        SUM(CASE WHEN "PaymentMethod" = 'Online' THEN 1 ELSE 0 END)::BIGINT AS online_checkouts,
        SUM(CASE WHEN "Status" = 'COMPLETED' THEN "TotalAmount" ELSE 0 END)::NUMERIC AS total_revenue,
        AVG(CASE WHEN "Status" = 'COMPLETED' THEN "TotalAmount"::NUMERIC ELSE NULL END) AS avg_order_value
    FROM "CartCheckout"
    WHERE "CreationTime" BETWEEN from_date AND to_date;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SUPABASE ROW LEVEL SECURITY (RLS) - Optional
-- Enable RLS for all tables (uncomment if needed)
-- =============================================
/*
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CartCheckout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comments" ENABLE ROW LEVEL SECURITY;

-- Example RLS Policy: Users can only see their own data
CREATE POLICY "Users can view own data" ON "Users"
    FOR SELECT USING (auth.uid() = "Id");

CREATE POLICY "Users can update own data" ON "Users"
    FOR UPDATE USING (auth.uid() = "Id");
*/

-- =============================================
-- END OF MIGRATION
-- =============================================
