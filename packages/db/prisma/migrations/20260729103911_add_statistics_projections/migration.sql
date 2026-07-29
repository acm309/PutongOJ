-- CreateTable
CREATE TABLE "UserProblemStatus" (
    "userId" INTEGER NOT NULL,
    "problemId" INTEGER NOT NULL,
    "hasSubmitted" BOOLEAN NOT NULL,
    "hasAccepted" BOOLEAN NOT NULL,
    "firstAcceptedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "UserProblemStatus_pkey" PRIMARY KEY ("userId","problemId")
);

-- CreateTable
CREATE TABLE "UserSubmissionStats" (
    "userId" INTEGER NOT NULL,
    "submittedProblemCount" INTEGER NOT NULL DEFAULT 0,
    "solvedProblemCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "UserSubmissionStats_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ProblemSubmissionStats" (
    "problemId" INTEGER NOT NULL,
    "submitterCount" INTEGER NOT NULL DEFAULT 0,
    "solverCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProblemSubmissionStats_pkey" PRIMARY KEY ("problemId")
);

-- CreateTable
CREATE TABLE "DiscussionCommentStats" (
    "discussionId" INTEGER NOT NULL,
    "visibleCommentCount" INTEGER NOT NULL DEFAULT 0,
    "lastVisibleCommentAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DiscussionCommentStats_pkey" PRIMARY KEY ("discussionId")
);

-- CreateIndex
CREATE INDEX "UserProblemStatus_problemId_hasAccepted_idx" ON "UserProblemStatus"("problemId", "hasAccepted");

-- AddForeignKey
ALTER TABLE "UserProblemStatus" ADD CONSTRAINT "UserProblemStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProblemStatus" ADD CONSTRAINT "UserProblemStatus_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubmissionStats" ADD CONSTRAINT "UserSubmissionStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemSubmissionStats" ADD CONSTRAINT "ProblemSubmissionStats_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionCommentStats" ADD CONSTRAINT "DiscussionCommentStats_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
