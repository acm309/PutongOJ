import process from 'node:process'
import { removeall } from './helper'

async function main () {
  await removeall()
  const { createDatabaseClient } = await import('@putongoj/db')
  const database = createDatabaseClient(process.env.DATABASE_URL!)
  await database.$executeRawUnsafe(`
    TRUNCATE TABLE
      "SubmissionTestcaseResult",
      "Submission",
      "Comment",
      "Discussion",
      "ContestParticipation",
      "ContestProblem",
      "ContestIpWhitelist",
      "ContestAllowedGroup",
      "ContestAllowedUser",
      "Contest",
      "CourseProblem",
      "CourseMember",
      "Course",
      "ProblemTag",
      "Problem",
      "Tag",
      "GroupMember",
      "Group",
      "OAuthConnection",
      "File",
      "Post",
      "Setting",
      "UserProblemStatus",
      "UserSubmissionStats",
      "ProblemSubmissionStats",
      "DiscussionCommentStats",
      "User"
    RESTART IDENTITY CASCADE
  `)
  await database.$disconnect()
}

main()
  .then(() => {
    process.exit(0)
  })
