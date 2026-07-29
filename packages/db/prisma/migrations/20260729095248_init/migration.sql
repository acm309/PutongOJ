-- CreateEnum
CREATE TYPE "UserPrivilege" AS ENUM ('BANNED', 'USER', 'ADMIN', 'ROOT');

-- CreateEnum
CREATE TYPE "ProblemVisibility" AS ENUM ('RESERVED', 'AVAILABLE');

-- CreateEnum
CREATE TYPE "ProblemJudgeType" AS ENUM ('TRADITIONAL', 'INTERACTION', 'SPECIAL_JUDGE');

-- CreateEnum
CREATE TYPE "CourseVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "JudgeStatus" AS ENUM ('PENDING', 'RUNNING_JUDGE', 'COMPILE_ERROR', 'ACCEPTED', 'RUNTIME_ERROR', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'OUTPUT_LIMIT_EXCEEDED', 'PRESENTATION_ERROR', 'SYSTEM_ERROR', 'REJUDGE_PENDING', 'SKIPPED');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('C', 'CPP_11', 'JAVA', 'PYTHON', 'CPP_17', 'PYPY');

-- CreateEnum
CREATE TYPE "DiscussionType" AS ENUM ('OPEN_DISCUSSION', 'PUBLIC_ANNOUNCEMENT', 'PRIVATE_CLARIFICATION', 'ARCHIVED_DISCUSSION');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('NOT_APPLIED', 'PENDING', 'REJECTED', 'SUSPENDED', 'APPROVED', 'EARLY_EXIT');

-- CreateEnum
CREATE TYPE "LabelingStyle" AS ENUM ('NUMERIC', 'ALPHABETIC');

-- CreateEnum
CREATE TYPE "TagColor" AS ENUM ('DEFAULT', 'PURPLE', 'GEEKBLUE', 'BLUE', 'CYAN', 'GREEN', 'LIME', 'YELLOW', 'ORANGE', 'RED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(20) NOT NULL,
    "passwordHash" VARCHAR(72) NOT NULL,
    "privilege" "UserPrivilege" NOT NULL DEFAULT 'USER',
    "storageQuota" BIGINT NOT NULL DEFAULT 0,
    "nickname" VARCHAR(30) NOT NULL DEFAULT '',
    "avatarUrl" VARCHAR(2048) NOT NULL DEFAULT '',
    "motto" VARCHAR(300) NOT NULL DEFAULT '',
    "email" VARCHAR(254) NOT NULL DEFAULT '',
    "school" VARCHAR(30) NOT NULL DEFAULT '',
    "lastRequestId" TEXT,
    "lastVisitedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(79) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "groupId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("groupId","userId")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(29) NOT NULL,
    "color" "TagColor" NOT NULL DEFAULT 'DEFAULT',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(80) NOT NULL,
    "timeLimitMs" INTEGER NOT NULL DEFAULT 1000,
    "memoryLimitKb" INTEGER NOT NULL DEFAULT 32768,
    "description" TEXT NOT NULL DEFAULT '',
    "inputFormat" TEXT NOT NULL DEFAULT '',
    "outputFormat" TEXT NOT NULL DEFAULT '',
    "sampleInput" TEXT NOT NULL DEFAULT '',
    "sampleOutput" TEXT NOT NULL DEFAULT '',
    "hint" TEXT NOT NULL DEFAULT '',
    "visibility" "ProblemVisibility" NOT NULL DEFAULT 'RESERVED',
    "judgeType" "ProblemJudgeType" NOT NULL DEFAULT 'TRADITIONAL',
    "judgeCode" TEXT NOT NULL DEFAULT '',
    "ownerId" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemTag" (
    "problemId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "ProblemTag_pkey" PRIMARY KEY ("problemId","tagId")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(30) NOT NULL,
    "description" VARCHAR(100) NOT NULL DEFAULT '',
    "visibility" "CourseVisibility" NOT NULL DEFAULT 'PUBLIC',
    "joinCode" VARCHAR(20) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseMember" (
    "courseId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "canAccess" BOOLEAN NOT NULL DEFAULT false,
    "canViewTestcases" BOOLEAN NOT NULL DEFAULT false,
    "canViewSubmissions" BOOLEAN NOT NULL DEFAULT false,
    "canManageProblems" BOOLEAN NOT NULL DEFAULT false,
    "canManageContests" BOOLEAN NOT NULL DEFAULT false,
    "canManageCourse" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CourseMember_pkey" PRIMARY KEY ("courseId","userId")
);

-- CreateTable
CREATE TABLE "CourseProblem" (
    "courseId" INTEGER NOT NULL,
    "problemId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CourseProblem_pkey" PRIMARY KEY ("courseId","problemId")
);

-- CreateTable
CREATE TABLE "Contest" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "scoreboardFrozenAt" TIMESTAMP(3),
    "scoreboardUnfrozenAt" TIMESTAMP(3),
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT NOT NULL DEFAULT '',
    "ipWhitelistEnabled" BOOLEAN NOT NULL DEFAULT false,
    "allowEarlyExit" BOOLEAN NOT NULL DEFAULT false,
    "allowedLanguages" "Language"[] DEFAULT ARRAY[]::"Language"[],
    "labelingStyle" "LabelingStyle" NOT NULL DEFAULT 'NUMERIC',
    "courseId" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestAllowedUser" (
    "contestId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "ContestAllowedUser_pkey" PRIMARY KEY ("contestId","userId")
);

-- CreateTable
CREATE TABLE "ContestAllowedGroup" (
    "contestId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,

    CONSTRAINT "ContestAllowedGroup_pkey" PRIMARY KEY ("contestId","groupId")
);

-- CreateTable
CREATE TABLE "ContestIpWhitelist" (
    "contestId" INTEGER NOT NULL,
    "cidr" TEXT NOT NULL,
    "comment" VARCHAR(100),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ContestIpWhitelist_pkey" PRIMARY KEY ("contestId","cidr")
);

-- CreateTable
CREATE TABLE "ContestProblem" (
    "contestId" INTEGER NOT NULL,
    "problemId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ContestProblem_pkey" PRIMARY KEY ("contestId","problemId")
);

-- CreateTable
CREATE TABLE "ContestParticipation" (
    "contestId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" "ParticipationStatus" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ContestParticipation_pkey" PRIMARY KEY ("contestId","userId")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" SERIAL NOT NULL,
    "problemId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "contestId" INTEGER,
    "courseId" INTEGER,
    "sourceCode" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "status" "JudgeStatus" NOT NULL DEFAULT 'PENDING',
    "timeUsedMs" INTEGER NOT NULL DEFAULT 0,
    "memoryUsedKb" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT NOT NULL DEFAULT '',
    "similarity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "similarSubmissionId" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionTestcaseResult" (
    "submissionId" INTEGER NOT NULL,
    "testcaseId" TEXT NOT NULL,
    "status" "JudgeStatus" NOT NULL,
    "timeUsedMs" INTEGER NOT NULL,
    "memoryUsedKb" INTEGER NOT NULL,

    CONSTRAINT "SubmissionTestcaseResult_pkey" PRIMARY KEY ("submissionId","testcaseId")
);

-- CreateTable
CREATE TABLE "Discussion" (
    "id" SERIAL NOT NULL,
    "authorId" INTEGER NOT NULL,
    "problemId" INTEGER,
    "contestId" INTEGER,
    "type" "DiscussionType" NOT NULL DEFAULT 'PRIVATE_CLARIFICATION',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "title" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Discussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "discussionId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),
    "deletedById" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("storageKey")
);

-- CreateTable
CREATE TABLE "OAuthConnection" (
    "userId" INTEGER NOT NULL,
    "provider" VARCHAR(64) NOT NULL,
    "providerId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "raw" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "OAuthConnection_pkey" PRIMARY KEY ("userId","provider")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "publishesAt" TIMESTAMPTZ(3) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "GroupMember_userId_idx" ON "GroupMember"("userId");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Problem_ownerId_idx" ON "Problem"("ownerId");

-- CreateIndex
CREATE INDEX "ProblemTag_tagId_idx" ON "ProblemTag"("tagId");

-- CreateIndex
CREATE INDEX "CourseMember_userId_idx" ON "CourseMember"("userId");

-- CreateIndex
CREATE INDEX "CourseProblem_courseId_position_updatedAt_idx" ON "CourseProblem"("courseId", "position", "updatedAt");

-- CreateIndex
CREATE INDEX "CourseProblem_problemId_idx" ON "CourseProblem"("problemId");

-- CreateIndex
CREATE INDEX "Contest_courseId_idx" ON "Contest"("courseId");

-- CreateIndex
CREATE INDEX "ContestAllowedUser_userId_idx" ON "ContestAllowedUser"("userId");

-- CreateIndex
CREATE INDEX "ContestAllowedGroup_groupId_idx" ON "ContestAllowedGroup"("groupId");

-- CreateIndex
CREATE INDEX "ContestProblem_problemId_idx" ON "ContestProblem"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "ContestProblem_contestId_position_key" ON "ContestProblem"("contestId", "position");

-- CreateIndex
CREATE INDEX "ContestParticipation_userId_idx" ON "ContestParticipation"("userId");

-- CreateIndex
CREATE INDEX "ContestParticipation_contestId_status_updatedAt_idx" ON "ContestParticipation"("contestId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "Submission_problemId_createdAt_idx" ON "Submission"("problemId", "createdAt");

-- CreateIndex
CREATE INDEX "Submission_userId_createdAt_idx" ON "Submission"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Submission_contestId_problemId_createdAt_idx" ON "Submission"("contestId", "problemId", "createdAt");

-- CreateIndex
CREATE INDEX "Submission_status_createdAt_idx" ON "Submission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Discussion_authorId_idx" ON "Discussion"("authorId");

-- CreateIndex
CREATE INDEX "Discussion_problemId_idx" ON "Discussion"("problemId");

-- CreateIndex
CREATE INDEX "Discussion_contestId_idx" ON "Discussion"("contestId");

-- CreateIndex
CREATE INDEX "Comment_discussionId_createdAt_idx" ON "Comment"("discussionId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "File_ownerId_deletedAt_createdAt_idx" ON "File"("ownerId", "deletedAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthConnection_provider_providerId_key" ON "OAuthConnection"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemTag" ADD CONSTRAINT "ProblemTag_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemTag" ADD CONSTRAINT "ProblemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseMember" ADD CONSTRAINT "CourseMember_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseMember" ADD CONSTRAINT "CourseMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProblem" ADD CONSTRAINT "CourseProblem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseProblem" ADD CONSTRAINT "CourseProblem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contest" ADD CONSTRAINT "Contest_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestAllowedUser" ADD CONSTRAINT "ContestAllowedUser_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestAllowedUser" ADD CONSTRAINT "ContestAllowedUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestAllowedGroup" ADD CONSTRAINT "ContestAllowedGroup_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestAllowedGroup" ADD CONSTRAINT "ContestAllowedGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestIpWhitelist" ADD CONSTRAINT "ContestIpWhitelist_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestProblem" ADD CONSTRAINT "ContestProblem_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestProblem" ADD CONSTRAINT "ContestProblem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestParticipation" ADD CONSTRAINT "ContestParticipation_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestParticipation" ADD CONSTRAINT "ContestParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_similarSubmissionId_fkey" FOREIGN KEY ("similarSubmissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionTestcaseResult" ADD CONSTRAINT "SubmissionTestcaseResult_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthConnection" ADD CONSTRAINT "OAuthConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
