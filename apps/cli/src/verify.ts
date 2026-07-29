import type { PrismaClient } from '@putongoj/db'

export interface TargetVerificationReport {
  counts: Record<string, number>
  integrity: {
    orphanSubmissionProblem: number
    orphanSubmissionUser: number
    orphanSubmissionTestcase: number
    orphanSubmissionSimilarity: number
  }
}

export async function verifyPostgresTarget (
  database: PrismaClient,
): Promise<TargetVerificationReport> {
  const [
    users,
    groups,
    groupMembers,
    tags,
    problems,
    problemTags,
    courses,
    courseMembers,
    courseProblems,
    contests,
    contestAllowedUsers,
    contestAllowedGroups,
    contestIpWhitelist,
    contestProblems,
    contestParticipations,
    discussions,
    comments,
    files,
    oauthConnections,
    posts,
    settings,
    submissions,
    submissionTestcaseResults,
    userProblemStatuses,
    userSubmissionStats,
    problemSubmissionStats,
    discussionCommentStats,
    integrityRows,
    duplicateContestProblemRows,
  ] = await Promise.all([
    database.user.count(),
    database.group.count(),
    database.groupMember.count(),
    database.tag.count(),
    database.problem.count(),
    database.problemTag.count(),
    database.course.count(),
    database.courseMember.count(),
    database.courseProblem.count(),
    database.contest.count(),
    database.contestAllowedUser.count(),
    database.contestAllowedGroup.count(),
    database.contestIpWhitelist.count(),
    database.contestProblem.count(),
    database.contestParticipation.count(),
    database.discussion.count(),
    database.comment.count(),
    database.file.count(),
    database.oAuthConnection.count(),
    database.post.count(),
    database.setting.count(),
    database.submission.count(),
    database.submissionTestcaseResult.count(),
    database.userProblemStatus.count(),
    database.userSubmissionStats.count(),
    database.problemSubmissionStats.count(),
    database.discussionCommentStats.count(),
    database.$queryRaw<Array<{
      orphanSubmissionProblem: bigint
      orphanSubmissionUser: bigint
      orphanSubmissionTestcase: bigint
      orphanSubmissionSimilarity: bigint
    }>>`
      SELECT
        (SELECT COUNT(*)
          FROM "Submission" s
          LEFT JOIN "Problem" p ON p."id" = s."problemId"
          WHERE p."id" IS NULL) AS "orphanSubmissionProblem",
        (SELECT COUNT(*)
          FROM "Submission" s
          LEFT JOIN "User" u ON u."id" = s."userId"
          WHERE u."id" IS NULL) AS "orphanSubmissionUser",
        (SELECT COUNT(*)
          FROM "SubmissionTestcaseResult" r
          LEFT JOIN "Submission" s ON s."id" = r."submissionId"
          WHERE s."id" IS NULL) AS "orphanSubmissionTestcase",
        (SELECT COUNT(*)
          FROM "Submission" s
          LEFT JOIN "Submission" t ON t."id" = s."similarSubmissionId"
          WHERE s."similarSubmissionId" IS NOT NULL AND t."id" IS NULL)
          AS "orphanSubmissionSimilarity"
    `,
    database.$queryRaw<Array<{ duplicateCount: bigint }>>`
      SELECT COUNT(*) AS "duplicateCount"
      FROM (
        SELECT "contestId", "problemId", COUNT(*)
        FROM "ContestProblem"
        GROUP BY "contestId", "problemId"
        HAVING COUNT(*) > 1
      ) duplicate_rows
    `,
  ])

  const integrity = integrityRows[0]
  if (!integrity) {
    throw new Error('PostgreSQL integrity query did not return a result.')
  }
  if ((duplicateContestProblemRows[0]?.duplicateCount ?? 0n) > 0n) {
    throw new Error('ContestProblem contains duplicate contest/problem assignments.')
  }

  return {
    counts: {
      users,
      groups,
      groupMembers,
      tags,
      problems,
      problemTags,
      courses,
      courseMembers,
      courseProblems,
      contests,
      contestAllowedUsers,
      contestAllowedGroups,
      contestIpWhitelist,
      contestProblems,
      contestParticipations,
      discussions,
      comments,
      files,
      oauthConnections,
      posts,
      settings,
      submissions,
      submissionTestcaseResults,
      userProblemStatuses,
      userSubmissionStats,
      problemSubmissionStats,
      discussionCommentStats,
    },
    integrity: {
      orphanSubmissionProblem: Number(integrity.orphanSubmissionProblem),
      orphanSubmissionUser: Number(integrity.orphanSubmissionUser),
      orphanSubmissionTestcase: Number(integrity.orphanSubmissionTestcase),
      orphanSubmissionSimilarity: Number(integrity.orphanSubmissionSimilarity),
    },
  }
}
