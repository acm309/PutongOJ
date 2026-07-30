import process from 'node:process'
import redis from '../src/config/redis'

export async function resetDatabase () {
  const { createDatabaseClient } = await import('@putongoj/db')
  const database = createDatabaseClient(process.env.DATABASE_URL!)
  try {
    await database.$executeRawUnsafe(`
      TRUNCATE TABLE
        "SubmissionTestcaseResult", "Submission", "Comment", "Discussion",
        "ContestParticipation", "ContestProblem", "ContestIpWhitelist",
        "ContestAllowedGroup", "ContestAllowedUser", "Contest", "CourseProblem",
        "CourseMember", "Course", "ProblemTag", "Problem", "Tag", "GroupMember",
        "Group", "OAuthConnection", "File", "Post", "Setting", "UserProblemStatus",
        "UserSubmissionStats", "ProblemSubmissionStats", "DiscussionCommentStats", "User"
      RESTART IDENTITY CASCADE
    `)
    await redis.flushdb()
  } finally {
    await database.$disconnect()
  }
}

export const removeall = resetDatabase
