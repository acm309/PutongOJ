import type { PrismaClient } from '@putongoj/db'

export type StatisticsScope = 'all' | 'discussion' | 'problem' | 'user'

export interface StatisticsRebuildReport {
  userProblemStatuses: number
  userSubmissionStats: number
  problemSubmissionStats: number
  discussionCommentStats: number
}

export async function rebuildStatistics (
  database: PrismaClient,
  scope: StatisticsScope = 'all',
): Promise<StatisticsRebuildReport> {
  if (scope === 'all' || scope === 'user' || scope === 'problem') {
    await database.$executeRawUnsafe(`
      TRUNCATE TABLE
        "UserProblemStatus",
        "UserSubmissionStats",
        "ProblemSubmissionStats"
    `)
    await database.$executeRawUnsafe(`
      INSERT INTO "UserProblemStatus" (
        "userId", "problemId", "hasSubmitted", "hasAccepted",
        "firstAcceptedAt", "updatedAt"
      )
      SELECT
        s."userId",
        s."problemId",
        BOOL_OR(s."status" <> 'SKIPPED'::"JudgeStatus"),
        BOOL_OR(s."status" = 'ACCEPTED'::"JudgeStatus"),
        MIN(s."createdAt") FILTER (
          WHERE s."status" = 'ACCEPTED'::"JudgeStatus"
        ),
        NOW()
      FROM "Submission" s
      GROUP BY s."userId", s."problemId"
    `)
    await database.$executeRawUnsafe(`
      INSERT INTO "UserSubmissionStats" (
        "userId", "submittedProblemCount", "solvedProblemCount", "updatedAt"
      )
      SELECT
        u."id",
        COUNT(ups."problemId") FILTER (WHERE ups."hasSubmitted"),
        COUNT(ups."problemId") FILTER (WHERE ups."hasAccepted"),
        NOW()
      FROM "User" u
      LEFT JOIN "UserProblemStatus" ups ON ups."userId" = u."id"
      GROUP BY u."id"
    `)
    await database.$executeRawUnsafe(`
      INSERT INTO "ProblemSubmissionStats" (
        "problemId", "submitterCount", "solverCount", "updatedAt"
      )
      SELECT
        p."id",
        COUNT(ups."userId") FILTER (WHERE ups."hasSubmitted"),
        COUNT(ups."userId") FILTER (WHERE ups."hasAccepted"),
        NOW()
      FROM "Problem" p
      LEFT JOIN "UserProblemStatus" ups ON ups."problemId" = p."id"
      GROUP BY p."id"
    `)
  }

  if (scope === 'all' || scope === 'discussion') {
    await database.$executeRawUnsafe(`TRUNCATE TABLE "DiscussionCommentStats"`)
    await database.$executeRawUnsafe(`
      INSERT INTO "DiscussionCommentStats" (
        "discussionId", "visibleCommentCount", "lastVisibleCommentAt", "updatedAt"
      )
      SELECT
        d."id",
        COUNT(c."id"),
        COALESCE(MAX(c."createdAt"), d."createdAt"),
        NOW()
      FROM "Discussion" d
      LEFT JOIN "Comment" c
        ON c."discussionId" = d."id"
        AND c."isHidden" = false
      GROUP BY d."id", d."createdAt"
    `)
  }

  const [
    userProblemStatuses,
    userSubmissionStats,
    problemSubmissionStats,
    discussionCommentStats,
  ] = await Promise.all([
    database.userProblemStatus.count(),
    database.userSubmissionStats.count(),
    database.problemSubmissionStats.count(),
    database.discussionCommentStats.count(),
  ])

  return {
    userProblemStatuses,
    userSubmissionStats,
    problemSubmissionStats,
    discussionCommentStats,
  }
}
