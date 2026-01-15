-- CreateTable
CREATE TABLE "Articles" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Content" VARCHAR(3000) NOT NULL,
    "Title" VARCHAR(255) NOT NULL,
    "Status" VARCHAR(45) NOT NULL DEFAULT 'Draft',
    "IsCommentDisabled" BOOLEAN NOT NULL DEFAULT false,
    "CommentCount" INTEGER NOT NULL DEFAULT 0,
    "ViewCount" INTEGER NOT NULL DEFAULT 0,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatorId" UUID NOT NULL,
    "LastModifierId" UUID NOT NULL,

    CONSTRAINT "PK_Articles" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "AssignmentCompletions" (
    "Id" BIGSERIAL NOT NULL,
    "UserId" UUID NOT NULL,
    "AssignmentId" UUID NOT NULL,
    "CompletedDate" TIMESTAMP(6),

    CONSTRAINT "PK_AssignmentCompletions" PRIMARY KEY ("Id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "Bills" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Action" VARCHAR(100) NOT NULL,
    "Note" VARCHAR(255) NOT NULL DEFAULT '',
    "Amount" BIGINT NOT NULL DEFAULT 0,
    "Gateway" VARCHAR(20) NOT NULL,
    "TransactionId" VARCHAR(100) NOT NULL DEFAULT '',
    "ClientTransactionId" VARCHAR(100) NOT NULL DEFAULT '',
    "Token" VARCHAR(100) NOT NULL DEFAULT '',
    "IsSuccessful" BOOLEAN NOT NULL DEFAULT false,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatorId" UUID NOT NULL,

    CONSTRAINT "PK_Bills" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "CAT_Logs" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "UserId" UUID,
    "QuestionId" UUID,
    "Response" BOOLEAN,
    "ThetaBefore" DOUBLE PRECISION,
    "ThetaAfter" DOUBLE PRECISION,
    "Timestamp" TIMESTAMP(6),
    "CourseId" UUID,
    "AssignmentId" UUID,

    CONSTRAINT "PK_CAT_Logs" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "CAT_Results" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL,
    "CourseId" UUID NOT NULL,
    "AssignmentId" UUID,
    "FinalTheta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "CorrectCount" INTEGER NOT NULL DEFAULT 0,
    "TotalQuestions" INTEGER NOT NULL DEFAULT 0,
    "CompletionTime" TIMESTAMP(6),
    "ThetaBefore" DOUBLE PRECISION,
    "ThetaAfter" DOUBLE PRECISION,

    CONSTRAINT "PK_CAT_Results" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "CartCheckout" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL,
    "CourseIds" TEXT NOT NULL DEFAULT '[]',
    "TotalAmount" BIGINT NOT NULL DEFAULT 0,
    "PaymentMethod" VARCHAR(20) NOT NULL,
    "Status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ProcessedTime" TIMESTAMP(6),
    "Notes" VARCHAR(500),
    "SessionId" VARCHAR(100),

    CONSTRAINT "PK_CartCheckout" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Categories" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Path" VARCHAR(255) NOT NULL,
    "Title" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(1000) NOT NULL DEFAULT '',
    "IsLeaf" BOOLEAN NOT NULL DEFAULT false,
    "CourseCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PK_Categories" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ChatMessages" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Content" VARCHAR(255) NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'Sent',
    "ConversationId" UUID NOT NULL,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatorId" UUID NOT NULL,
    "LastModifierId" UUID NOT NULL,
    "message_type" VARCHAR(20) NOT NULL DEFAULT 'text',
    "is_edited" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PK_ChatMessages" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "CommentMedia" (
    "CommentId" UUID NOT NULL,
    "Id" SERIAL NOT NULL,
    "Type" TEXT NOT NULL,
    "Url" VARCHAR(255) NOT NULL,

    CONSTRAINT "PK_CommentMedia" PRIMARY KEY ("CommentId","Id")
);

-- CreateTable
CREATE TABLE "Comments" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Content" VARCHAR(500) NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'Active',
    "SourceType" TEXT NOT NULL,
    "ParentId" UUID,
    "LectureId" UUID,
    "ArticleId" UUID,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatorId" UUID NOT NULL,
    "LastModifierId" UUID NOT NULL,

    CONSTRAINT "PK_Comments" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ConversationMembers" (
    "CreatorId" UUID NOT NULL,
    "ConversationId" UUID NOT NULL,
    "IsAdmin" BOOLEAN NOT NULL DEFAULT false,
    "LastVisit" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_ConversationMembers" PRIMARY KEY ("CreatorId","ConversationId")
);

-- CreateTable
CREATE TABLE "Conversations" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Title" VARCHAR(45) NOT NULL DEFAULT '',
    "IsPrivate" BOOLEAN NOT NULL DEFAULT false,
    "AvatarUrl" VARCHAR(255) NOT NULL DEFAULT '',
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatorId" UUID NOT NULL,
    "last_message_at" TIMESTAMP(6),
    "is_group" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PK_Conversations" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "CourseMeta" (
    "CourseId" UUID NOT NULL,
    "Id" SERIAL NOT NULL,
    "Type" SMALLINT NOT NULL DEFAULT 0,
    "Value" VARCHAR(100) NOT NULL DEFAULT '',

    CONSTRAINT "PK_CourseMeta" PRIMARY KEY ("CourseId","Id")
);

-- CreateTable
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
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ProcessedTime" TIMESTAMP(6),
    "ProcessedBy" UUID,

    CONSTRAINT "PK_CourseNotifications" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "CourseReviews" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Content" VARCHAR(500) NOT NULL DEFAULT '',
    "Rating" SMALLINT NOT NULL DEFAULT 5,
    "CourseId" UUID NOT NULL,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatorId" UUID NOT NULL,
    "LastModifierId" UUID NOT NULL,

    CONSTRAINT "PK_CourseReviews" PRIMARY KEY ("Id")
);

-- CreateTable
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
    "DiscountExpiry" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Level" TEXT NOT NULL DEFAULT 'Beginner',
    "Outcomes" VARCHAR(500) NOT NULL DEFAULT '',
    "Requirements" VARCHAR(500) NOT NULL DEFAULT '',
    "LectureCount" SMALLINT NOT NULL DEFAULT 0,
    "LearnerCount" INTEGER NOT NULL DEFAULT 0,
    "RatingCount" INTEGER NOT NULL DEFAULT 0,
    "TotalRating" BIGINT NOT NULL DEFAULT 0,
    "LeafCategoryId" UUID NOT NULL,
    "InstructorId" UUID NOT NULL,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatorId" UUID NOT NULL,
    "LastModifierId" UUID NOT NULL,
    "DismissReason" VARCHAR(1000),
    "RejectionReason" VARCHAR(1000),
    "ApprovalStatus" VARCHAR(50) NOT NULL DEFAULT 'Pending',

    CONSTRAINT "PK_Courses" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Enrollments" (
    "CreatorId" UUID NOT NULL,
    "CourseId" UUID NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'Active',
    "BillId" UUID,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "AssignmentMilestones" TEXT NOT NULL DEFAULT '[]',
    "LectureMilestones" TEXT NOT NULL DEFAULT '[]',
    "SectionMilestones" TEXT NOT NULL DEFAULT '[]',
    "LastViewedLectureId" UUID,

    CONSTRAINT "PK_Enrollments" PRIMARY KEY ("CreatorId","CourseId")
);

-- CreateTable
CREATE TABLE "Instructors" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Intro" VARCHAR(500) NOT NULL DEFAULT '',
    "Experience" VARCHAR(1000) NOT NULL DEFAULT '',
    "CreatorId" UUID NOT NULL,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Balance" BIGINT NOT NULL DEFAULT 0,
    "CourseCount" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "PK_Instructors" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "LectureCompletions" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL,
    "LectureId" UUID NOT NULL,
    "CompletedDate" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_LectureCompletions" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "LectureMaterial" (
    "LectureId" UUID NOT NULL,
    "Id" SERIAL NOT NULL,
    "Type" TEXT NOT NULL,
    "Url" VARCHAR(255) NOT NULL,

    CONSTRAINT "PK_LectureMaterial" PRIMARY KEY ("LectureId","Id")
);

-- CreateTable
CREATE TABLE "Lectures" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Title" VARCHAR(255) NOT NULL,
    "Content" VARCHAR(3000) NOT NULL DEFAULT '',
    "SectionId" UUID NOT NULL,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "IsPreviewable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PK_Lectures" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "McqChoices" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Content" TEXT,
    "IsCorrect" BOOLEAN NOT NULL DEFAULT false,
    "McqQuestionId" UUID,

    CONSTRAINT "PK_McqChoices" PRIMARY KEY ("Id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "McqUserAnswer" (
    "SubmissionId" UUID NOT NULL,
    "MCQChoiceId" UUID NOT NULL,

    CONSTRAINT "PK_McqUserAnswer" PRIMARY KEY ("SubmissionId","MCQChoiceId")
);

-- CreateTable
CREATE TABLE "Notifications" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Message" VARCHAR(255) NOT NULL,
    "Type" TEXT NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'Unread',
    "ReceiverId" UUID,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatorId" UUID NOT NULL,

    CONSTRAINT "PK_Notifications" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "PrivateConversations" (
    "conversation_id" SERIAL NOT NULL,
    "user1_id" VARCHAR(50) NOT NULL,
    "user2_id" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_at" TIMESTAMP(6),
    "last_message_text" TEXT,

    CONSTRAINT "PK_PrivateConversations" PRIMARY KEY ("conversation_id")
);

-- CreateTable
CREATE TABLE "PrivateMessages" (
    "message_id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "sender_id" VARCHAR(50) NOT NULL,
    "message_text" TEXT NOT NULL,
    "sent_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PK_PrivateMessages" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "Reactions" (
    "CreatorId" UUID NOT NULL,
    "SourceEntityId" UUID NOT NULL,
    "Content" VARCHAR(10) NOT NULL,
    "SourceType" TEXT NOT NULL,
    "ArticleId" UUID,
    "ChatMessageId" UUID,
    "CommentId" UUID,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_Reactions" PRIMARY KEY ("CreatorId","SourceEntityId")
);

-- CreateTable
CREATE TABLE "Sections" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Index" SMALLINT NOT NULL DEFAULT 0,
    "Title" VARCHAR(255) NOT NULL,
    "LectureCount" SMALLINT NOT NULL DEFAULT 0,
    "CourseId" UUID NOT NULL,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_Sections" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Submissions" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "Mark" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "TimeSpentInSec" INTEGER NOT NULL DEFAULT 0,
    "AssignmentId" UUID NOT NULL,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatorId" UUID NOT NULL,
    "LastModifierId" UUID NOT NULL,

    CONSTRAINT "PK_Submissions" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "ArticleId" UUID NOT NULL,
    "Id" SERIAL NOT NULL,
    "Title" VARCHAR(45) NOT NULL,

    CONSTRAINT "PK_Tag" PRIMARY KEY ("ArticleId","Id")
);

-- CreateTable
CREATE TABLE "UserAbilities" (
    "Id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL,
    "CourseId" UUID NOT NULL,
    "Theta" DOUBLE PRECISION,
    "LastUpdate" TIMESTAMP(6),

    CONSTRAINT "PK_UserAbilities" PRIMARY KEY ("Id")
);

-- CreateTable
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
    "IsVerified" BOOLEAN NOT NULL DEFAULT false,
    "IsApproved" BOOLEAN NOT NULL DEFAULT false,
    "AccessFailedCount" SMALLINT NOT NULL DEFAULT 0,
    "LoginProvider" VARCHAR(100),
    "ProviderKey" VARCHAR(100),
    "Bio" VARCHAR(1000) NOT NULL DEFAULT '',
    "DateOfBirth" TIMESTAMP(6),
    "Phone" VARCHAR(45),
    "EnrollmentCount" INTEGER NOT NULL DEFAULT 0,
    "InstructorId" UUID,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModificationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "SystemBalance" BIGINT NOT NULL DEFAULT 0,
    "avatar_url" VARCHAR(255),
    "last_seen" TIMESTAMP(6),

    CONSTRAINT "PK_Users" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "__EFMigrationsHistory" (
    "MigrationId" VARCHAR(150) NOT NULL,
    "ProductVersion" VARCHAR(32) NOT NULL,

    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

-- CreateTable
CREATE TABLE "Wishlist" (
    "UserId" UUID NOT NULL,
    "CourseId" UUID NOT NULL,
    "CreationTime" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_Wishlist" PRIMARY KEY ("UserId","CourseId")
);

-- CreateIndex
CREATE INDEX "IX_Assignments_SectionId" ON "Assignments"("SectionId");

-- CreateIndex
CREATE INDEX "IX_Bills_CreatorId" ON "Bills"("CreatorId");

-- CreateIndex
CREATE INDEX "IX_CAT_Logs_CourseId" ON "CAT_Logs"("CourseId");

-- CreateIndex
CREATE INDEX "IX_CAT_Logs_UserId" ON "CAT_Logs"("UserId");

-- CreateIndex
CREATE INDEX "IX_CAT_Results_CourseId" ON "CAT_Results"("CourseId");

-- CreateIndex
CREATE INDEX "IX_CAT_Results_UserId" ON "CAT_Results"("UserId");

-- CreateIndex
CREATE INDEX "IX_CartCheckout_Status" ON "CartCheckout"("Status");

-- CreateIndex
CREATE INDEX "IX_CartCheckout_UserId" ON "CartCheckout"("UserId");

-- CreateIndex
CREATE INDEX "IX_ChatMessages_ConversationId" ON "ChatMessages"("ConversationId");

-- CreateIndex
CREATE INDEX "IX_Comments_ArticleId" ON "Comments"("ArticleId");

-- CreateIndex
CREATE INDEX "IX_Comments_LectureId" ON "Comments"("LectureId");

-- CreateIndex
CREATE INDEX "IX_Comments_ParentId" ON "Comments"("ParentId");

-- CreateIndex
CREATE INDEX "IX_CourseReviews_CourseId" ON "CourseReviews"("CourseId");

-- CreateIndex
CREATE INDEX "IX_Courses_InstructorId" ON "Courses"("InstructorId");

-- CreateIndex
CREATE INDEX "IX_Courses_LeafCategoryId" ON "Courses"("LeafCategoryId");

-- CreateIndex
CREATE INDEX "IX_Courses_Status" ON "Courses"("Status");

-- CreateIndex
CREATE INDEX "IX_Courses_ApprovalStatus_Status" ON "Courses"("ApprovalStatus", "Status");

-- CreateIndex
CREATE INDEX "IX_Courses_CreationTime" ON "Courses"("CreationTime");

-- CreateIndex
CREATE INDEX "IX_Courses_Price" ON "Courses"("Price");

-- CreateIndex
CREATE INDEX "IX_Courses_Level" ON "Courses"("Level");

-- CreateIndex
CREATE INDEX "IX_Enrollments_CourseId" ON "Enrollments"("CourseId");

-- CreateIndex
CREATE INDEX "IX_Enrollments_CreatorId" ON "Enrollments"("CreatorId");

-- CreateIndex
CREATE INDEX "IX_Lectures_SectionId" ON "Lectures"("SectionId");

-- CreateIndex
CREATE INDEX "IX_McqChoices_McqQuestionId" ON "McqChoices"("McqQuestionId");

-- CreateIndex
CREATE INDEX "IX_McqQuestions_AssignmentId" ON "McqQuestions"("AssignmentId");

-- CreateIndex
CREATE INDEX "IX_Notifications_ReceiverId" ON "Notifications"("ReceiverId");

-- CreateIndex
CREATE INDEX "IX_Sections_CourseId" ON "Sections"("CourseId");

-- CreateIndex
CREATE INDEX "IX_UserAbilities_CourseId" ON "UserAbilities"("CourseId");

-- CreateIndex
CREATE INDEX "IX_UserAbilities_UserId" ON "UserAbilities"("UserId");

-- CreateIndex
CREATE INDEX "IX_Users_Email" ON "Users"("Email");

-- CreateIndex
CREATE INDEX "IX_Users_InstructorId" ON "Users"("InstructorId");

-- CreateIndex
CREATE INDEX "IX_Users_UserName" ON "Users"("UserName");

-- CreateIndex
CREATE INDEX "IX_Wishlist_CourseId" ON "Wishlist"("CourseId");

-- CreateIndex
CREATE INDEX "IX_Wishlist_UserId" ON "Wishlist"("UserId");

-- AddForeignKey
ALTER TABLE "Articles" ADD CONSTRAINT "FK_Articles_Users" FOREIGN KEY ("CreatorId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AssignmentCompletions" ADD CONSTRAINT "FK_AssignmentCompletions_Assignments" FOREIGN KEY ("AssignmentId") REFERENCES "Assignments"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AssignmentCompletions" ADD CONSTRAINT "FK_AssignmentCompletions_Users" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Assignments" ADD CONSTRAINT "FK_Assignments_Sections" FOREIGN KEY ("SectionId") REFERENCES "Sections"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Assignments" ADD CONSTRAINT "FK_Assignments_Users" FOREIGN KEY ("CreatorId") REFERENCES "Users"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Bills" ADD CONSTRAINT "FK_Bills_Users" FOREIGN KEY ("CreatorId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CAT_Logs" ADD CONSTRAINT "FK_CAT_Logs_Assignments" FOREIGN KEY ("AssignmentId") REFERENCES "Assignments"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CAT_Logs" ADD CONSTRAINT "FK_CAT_Logs_Courses" FOREIGN KEY ("CourseId") REFERENCES "Courses"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CAT_Logs" ADD CONSTRAINT "FK_CAT_Logs_McqQuestions" FOREIGN KEY ("QuestionId") REFERENCES "McqQuestions"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CAT_Logs" ADD CONSTRAINT "FK_CAT_Logs_Users" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CAT_Results" ADD CONSTRAINT "FK_CAT_Results_Assignments" FOREIGN KEY ("AssignmentId") REFERENCES "Assignments"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CAT_Results" ADD CONSTRAINT "FK_CAT_Results_Courses" FOREIGN KEY ("CourseId") REFERENCES "Courses"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CAT_Results" ADD CONSTRAINT "FK_CAT_Results_Users" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CartCheckout" ADD CONSTRAINT "FK_CartCheckout_Users" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ChatMessages" ADD CONSTRAINT "FK_ChatMessages_Conversations" FOREIGN KEY ("ConversationId") REFERENCES "Conversations"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ChatMessages" ADD CONSTRAINT "FK_ChatMessages_Users" FOREIGN KEY ("CreatorId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CommentMedia" ADD CONSTRAINT "FK_CommentMedia_Comments" FOREIGN KEY ("CommentId") REFERENCES "Comments"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "FK_Comments_Articles" FOREIGN KEY ("ArticleId") REFERENCES "Articles"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "FK_Comments_Comments" FOREIGN KEY ("ParentId") REFERENCES "Comments"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "FK_Comments_Lectures" FOREIGN KEY ("LectureId") REFERENCES "Lectures"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Comments" ADD CONSTRAINT "FK_Comments_Users" FOREIGN KEY ("CreatorId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConversationMembers" ADD CONSTRAINT "FK_ConversationMembers_Conversations" FOREIGN KEY ("ConversationId") REFERENCES "Conversations"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ConversationMembers" ADD CONSTRAINT "FK_ConversationMembers_Users" FOREIGN KEY ("CreatorId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Conversations" ADD CONSTRAINT "FK_Conversations_Users" FOREIGN KEY ("CreatorId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CourseMeta" ADD CONSTRAINT "FK_CourseMeta_Courses" FOREIGN KEY ("CourseId") REFERENCES "Courses"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CourseNotifications" ADD CONSTRAINT "FK_CourseNotifications_Courses" FOREIGN KEY ("CourseId") REFERENCES "Courses"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CourseNotifications" ADD CONSTRAINT "FK_CourseNotifications_Instructors" FOREIGN KEY ("InstructorId") REFERENCES "Instructors"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CourseReviews" ADD CONSTRAINT "FK_CourseReviews_Courses" FOREIGN KEY ("CourseId") REFERENCES "Courses"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CourseReviews" ADD CONSTRAINT "FK_CourseReviews_Users" FOREIGN KEY ("CreatorId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Courses" ADD CONSTRAINT "FK_Courses_Categories" FOREIGN KEY ("LeafCategoryId") REFERENCES "Categories"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Courses" ADD CONSTRAINT "FK_Courses_Instructors" FOREIGN KEY ("InstructorId") REFERENCES "Instructors"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Courses" ADD CONSTRAINT "FK_Courses_Users_Creator" FOREIGN KEY ("CreatorId") REFERENCES "Users"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Enrollments" ADD CONSTRAINT "FK_Enrollments_Bills" FOREIGN KEY ("BillId") REFERENCES "Bills"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Enrollments" ADD CONSTRAINT "FK_Enrollments_Courses" FOREIGN KEY ("CourseId") REFERENCES "Courses"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Enrollments" ADD CONSTRAINT "FK_Enrollments_Lectures" FOREIGN KEY ("LastViewedLectureId") REFERENCES "Lectures"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Enrollments" ADD CONSTRAINT "FK_Enrollments_Users" FOREIGN KEY ("CreatorId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Instructors" ADD CONSTRAINT "FK_Instructors_Users" FOREIGN KEY ("CreatorId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "LectureCompletions" ADD CONSTRAINT "FK_LectureCompletions_Lectures" FOREIGN KEY ("LectureId") REFERENCES "Lectures"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "LectureCompletions" ADD CONSTRAINT "FK_LectureCompletions_Users" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "LectureMaterial" ADD CONSTRAINT "FK_LectureMaterial_Lectures" FOREIGN KEY ("LectureId") REFERENCES "Lectures"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Lectures" ADD CONSTRAINT "FK_Lectures_Sections" FOREIGN KEY ("SectionId") REFERENCES "Sections"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "McqChoices" ADD CONSTRAINT "FK_McqChoices_McqQuestions" FOREIGN KEY ("McqQuestionId") REFERENCES "McqQuestions"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "McqQuestions" ADD CONSTRAINT "FK_McqQuestions_Assignments" FOREIGN KEY ("AssignmentId") REFERENCES "Assignments"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "McqUserAnswer" ADD CONSTRAINT "FK_McqUserAnswer_McqChoices" FOREIGN KEY ("MCQChoiceId") REFERENCES "McqChoices"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "McqUserAnswer" ADD CONSTRAINT "FK_McqUserAnswer_Submissions" FOREIGN KEY ("SubmissionId") REFERENCES "Submissions"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "FK_Notifications_Users_Creator" FOREIGN KEY ("CreatorId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "FK_Notifications_Users_Receiver" FOREIGN KEY ("ReceiverId") REFERENCES "Users"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PrivateMessages" ADD CONSTRAINT "FK_PrivateMessages_PrivateConversations" FOREIGN KEY ("conversation_id") REFERENCES "PrivateConversations"("conversation_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Reactions" ADD CONSTRAINT "FK_Reactions_Articles" FOREIGN KEY ("ArticleId") REFERENCES "Articles"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Reactions" ADD CONSTRAINT "FK_Reactions_ChatMessages" FOREIGN KEY ("ChatMessageId") REFERENCES "ChatMessages"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Reactions" ADD CONSTRAINT "FK_Reactions_Comments" FOREIGN KEY ("CommentId") REFERENCES "Comments"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Reactions" ADD CONSTRAINT "FK_Reactions_Users" FOREIGN KEY ("CreatorId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Sections" ADD CONSTRAINT "FK_Sections_Courses" FOREIGN KEY ("CourseId") REFERENCES "Courses"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Submissions" ADD CONSTRAINT "FK_Submissions_Assignments" FOREIGN KEY ("AssignmentId") REFERENCES "Assignments"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Submissions" ADD CONSTRAINT "FK_Submissions_Users" FOREIGN KEY ("CreatorId") REFERENCES "Users"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "FK_Tag_Articles" FOREIGN KEY ("ArticleId") REFERENCES "Articles"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserAbilities" ADD CONSTRAINT "FK_UserAbilities_Courses" FOREIGN KEY ("CourseId") REFERENCES "Courses"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserAbilities" ADD CONSTRAINT "FK_UserAbilities_Users" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "FK_Users_Instructors" FOREIGN KEY ("InstructorId") REFERENCES "Instructors"("Id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "FK_Wishlist_Users" FOREIGN KEY ("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "FK_Wishlist_Courses" FOREIGN KEY ("CourseId") REFERENCES "Courses"("Id") ON DELETE CASCADE ON UPDATE NO ACTION;

