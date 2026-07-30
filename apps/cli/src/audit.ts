import type { Db, Document, ObjectId } from 'mongodb'

export interface AuditIssue {
  code: string
  count: number
  detail: string
}

export interface AuditReport {
  issues: AuditIssue[]
  summary: {
    errorCount: number
    warningCount: number
  }
}

interface RelationCheck {
  code: string
  sourceCollection: string
  sourceField: string
  targetCollection: string
  severity: 'error' | 'warning'
  detail: string
}

const relationChecks: RelationCheck[] = [
  {
    code: 'missing_problem_owner',
    sourceCollection: 'Problem',
    sourceField: 'owner',
    targetCollection: 'User',
    severity: 'warning',
    detail: 'Problem.owner references no User document.',
  },
  {
    code: 'missing_course_member_user',
    sourceCollection: 'CourseMember',
    sourceField: 'user',
    targetCollection: 'User',
    severity: 'error',
    detail: 'CourseMember.user references no User document.',
  },
  {
    code: 'missing_course_member_course',
    sourceCollection: 'CourseMember',
    sourceField: 'course',
    targetCollection: 'Course',
    severity: 'error',
    detail: 'CourseMember.course references no Course document.',
  },
  {
    code: 'missing_course_problem_course',
    sourceCollection: 'CourseProblem',
    sourceField: 'course',
    targetCollection: 'Course',
    severity: 'error',
    detail: 'CourseProblem.course references no Course document.',
  },
  {
    code: 'missing_course_problem_problem',
    sourceCollection: 'CourseProblem',
    sourceField: 'problem',
    targetCollection: 'Problem',
    severity: 'error',
    detail: 'CourseProblem.problem references no Problem document.',
  },
  {
    code: 'missing_participation_contest',
    sourceCollection: 'ContestParticipation',
    sourceField: 'contest',
    targetCollection: 'Contest',
    severity: 'error',
    detail: 'ContestParticipation.contest references no Contest document.',
  },
  {
    code: 'missing_participation_user',
    sourceCollection: 'ContestParticipation',
    sourceField: 'user',
    targetCollection: 'User',
    severity: 'error',
    detail: 'ContestParticipation.user references no User document.',
  },
  {
    code: 'missing_discussion_author',
    sourceCollection: 'Discussion',
    sourceField: 'author',
    targetCollection: 'User',
    severity: 'error',
    detail: 'Discussion.author references no User document.',
  },
  {
    code: 'missing_discussion_problem',
    sourceCollection: 'Discussion',
    sourceField: 'problem',
    targetCollection: 'Problem',
    severity: 'warning',
    detail: 'Discussion.problem references no Problem document.',
  },
  {
    code: 'missing_discussion_contest',
    sourceCollection: 'Discussion',
    sourceField: 'contest',
    targetCollection: 'Contest',
    severity: 'warning',
    detail: 'Discussion.contest references no Contest document.',
  },
  {
    code: 'missing_comment_discussion',
    sourceCollection: 'Comment',
    sourceField: 'discussion',
    targetCollection: 'Discussion',
    severity: 'error',
    detail: 'Comment.discussion references no Discussion document.',
  },
  {
    code: 'missing_comment_author',
    sourceCollection: 'Comment',
    sourceField: 'author',
    targetCollection: 'User',
    severity: 'error',
    detail: 'Comment.author references no User document.',
  },
  {
    code: 'missing_file_owner',
    sourceCollection: 'Files',
    sourceField: 'owner',
    targetCollection: 'User',
    severity: 'error',
    detail: 'Files.owner references no User document.',
  },
  {
    code: 'missing_file_deleted_by',
    sourceCollection: 'Files',
    sourceField: 'deletedBy',
    targetCollection: 'User',
    severity: 'warning',
    detail: 'Files.deletedBy references no User document.',
  },
  {
    code: 'missing_oauth_user',
    sourceCollection: 'OAuth',
    sourceField: 'user',
    targetCollection: 'User',
    severity: 'error',
    detail: 'OAuth.user references no User document.',
  },
]

const duplicateCompositeChecks: Array<{ collection: string, fields: string[] }> = [
  { collection: 'CourseMember', fields: [ 'course', 'user' ] },
  { collection: 'CourseProblem', fields: [ 'course', 'problem' ] },
  { collection: 'ContestParticipation', fields: [ 'contest', 'user' ] },
]

const arrayReferenceChecks: Array<{
  sourceCollection: string
  sourceField: string
  targetCollection: string
}> = [
  { sourceCollection: 'Contest', sourceField: 'allowedUsers', targetCollection: 'User' },
  { sourceCollection: 'Contest', sourceField: 'allowedGroups', targetCollection: 'Group' },
  { sourceCollection: 'Contest', sourceField: 'problems', targetCollection: 'Problem' },
  { sourceCollection: 'Problem', sourceField: 'tags', targetCollection: 'Tag' },
]

const enumChecks: Array<{
  collection: string
  field: string
  values: readonly number[]
}> = [
  { collection: 'User', field: 'privilege', values: [ 0, 1, 2, 3 ] },
  { collection: 'Problem', field: 'status', values: [ 0, 2 ] },
  { collection: 'Problem', field: 'type', values: [ 1, 2, 3 ] },
  { collection: 'Solution', field: 'judge', values: Array.from({ length: 13 }, (_, value) => value) },
  { collection: 'ContestParticipation', field: 'status', values: [ 0, 1, 2, 3, 4, 5 ] },
  { collection: 'Contest', field: 'labelingStyle', values: [ 1, 2 ] },
]

const tagColors = [
  'default',
  'purple',
  'geekblue',
  'blue',
  'cyan',
  'green',
  'lime',
  'yellow',
  'orange',
  'red',
]

const legacyTagColorAliases: Record<string, string> = {
  gold: 'yellow',
}

function optionalObjectIdMatch (field: string): Document {
  return {
    [field]: {
      $exists: true,
      $ne: null,
    },
  }
}

async function countDanglingObjectIdRelation (
  database: Db,
  check: RelationCheck,
): Promise<AuditIssue | null> {
  const result = await database.collection(check.sourceCollection).aggregate([
    { $match: optionalObjectIdMatch(check.sourceField) },
    {
      $lookup: {
        from: check.targetCollection,
        localField: check.sourceField,
        foreignField: '_id',
        as: 'target',
      },
    },
    { $match: { target: { $eq: [] } } },
    { $count: 'count' },
  ]).toArray()
  const count = (result[0]?.count as number | undefined) ?? 0
  return count === 0
    ? null
    : {
        code: check.code,
        count,
        detail: `[${check.severity}] ${check.detail}`,
      }
}

async function countDanglingUserGroups (database: Db): Promise<AuditIssue | null> {
  const result = await database.collection('User').aggregate([
    { $unwind: '$gid' },
    {
      $lookup: {
        from: 'Group',
        let: { groupId: '$gid' },
        pipeline: [ { $match: { $expr: { $eq: [ '$gid', '$$groupId' ] } } } ],
        as: 'group',
      },
    },
    { $match: { group: { $eq: [] } } },
    { $count: 'count' },
  ]).toArray()
  const count = (result[0]?.count as number | undefined) ?? 0
  return count === 0
    ? null
    : {
        code: 'missing_user_group',
        count,
        detail: '[error] User.gid contains a group ID with no Group document.',
      }
}

async function countDuplicateCompositeRecords (
  database: Db,
  collection: string,
  fields: string[],
): Promise<number> {
  const groupId = Object.fromEntries(fields.map(field => [ field, `$${field}` ]))
  const result = await database.collection(collection).aggregate([
    { $group: { _id: groupId, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $count: 'count' },
  ]).toArray()
  return (result[0]?.count as number | undefined) ?? 0
}

async function countMissingArrayReferences (
  database: Db,
  sourceCollection: string,
  sourceField: string,
  targetCollection: string,
): Promise<number> {
  const result = await database.collection(sourceCollection).aggregate([
    { $unwind: `$${sourceField}` },
    {
      $lookup: {
        from: targetCollection,
        localField: sourceField,
        foreignField: '_id',
        as: 'target',
      },
    },
    { $match: { target: { $eq: [] } } },
    { $count: 'count' },
  ]).toArray()
  return (result[0]?.count as number | undefined) ?? 0
}

async function countInvalidEnumValues (
  database: Db,
  collection: string,
  field: string,
  values: readonly number[],
): Promise<number> {
  return await database.collection(collection).countDocuments({
    [field]: { $nin: values },
  })
}

async function countDuplicateContestProblems (database: Db): Promise<number> {
  const result = await database.collection('Contest').aggregate([
    { $unwind: '$problems' },
    { $group: { _id: { contest: '$_id', problem: '$problems' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $group: { _id: null, count: { $sum: { $subtract: [ '$count', 1 ] } } } },
  ]).toArray()
  return (result[0]?.count as number | undefined) ?? 0
}

async function countMissingField (
  database: Db,
  collection: string,
  field: string,
): Promise<number> {
  return await database.collection(collection).countDocuments({
    [field]: { $exists: false },
  })
}

async function countMissingSimilarSubmissions (database: Db): Promise<number> {
  const result = await database.collection('Solution').aggregate([
    { $match: { sim_s_id: { $nin: [ 0, null ] } } },
    {
      $lookup: {
        from: 'Solution',
        localField: 'sim_s_id',
        foreignField: 'sid',
        as: 'similarSubmission',
      },
    },
    { $match: { similarSubmission: { $eq: [] } } },
    { $count: 'count' },
  ]).toArray()
  return (result[0]?.count as number | undefined) ?? 0
}

async function countInvalidSubmissionIdentifiers (database: Db): Promise<number> {
  return await database.collection('Solution').countDocuments({
    $or: [
      { sid: { $not: { $type: 'number' } } },
      { sid: { $lte: 0 } },
      { pid: { $not: { $type: 'number' } } },
      { pid: { $lte: 0 } },
    ],
  })
}

async function countMissingSubmissionContests (database: Db): Promise<number> {
  const result = await database.collection('Solution').aggregate([
    { $match: { mid: { $gt: 0 } } },
    {
      $lookup: {
        from: 'Contest',
        localField: 'mid',
        foreignField: 'contestId',
        as: 'contest',
      },
    },
    { $match: { contest: { $eq: [] } } },
    { $count: 'count' },
  ]).toArray()
  return (result[0]?.count as number | undefined) ?? 0
}

export async function auditMongoSource (database: Db): Promise<AuditReport> {
  const issues = (await Promise.all([
    ...relationChecks.map(check => countDanglingObjectIdRelation(database, check)),
    countDanglingUserGroups(database),
    ...duplicateCompositeChecks.map(async ({ collection, fields }) => {
      const count = await countDuplicateCompositeRecords(database, collection, fields)
      return count === 0
        ? null
        : {
          code: `duplicate_${String(collection).toLowerCase()}`,
          count,
          detail: `[error] ${collection} has duplicate (${fields.join(', ')}) records.`,
        } satisfies AuditIssue
    }),
    (async () => {
      const count = await countDuplicateContestProblems(database)
      return count === 0
        ? null
        : {
          code: 'duplicate_contest_problem',
          count,
          detail: '[warning] Contest.problems repeats a problem; migration keeps its first occurrence.',
        } satisfies AuditIssue
    })(),
    ...arrayReferenceChecks.map(async ({
      sourceCollection, sourceField, targetCollection,
    }) => {
      const count = await countMissingArrayReferences(
        database,
        sourceCollection,
        sourceField,
        targetCollection,
      )
      return count === 0
        ? null
        : {
          code: `missing_${sourceCollection.toLowerCase()}_${sourceField}`,
          count,
          detail: `[error] ${sourceCollection}.${sourceField} includes a missing ${targetCollection} reference.`,
        } satisfies AuditIssue
    }),
    ...enumChecks.map(async ({ collection, field, values }) => {
      const count = await countInvalidEnumValues(
        database,
        collection,
        field,
        values,
      )
      return count === 0
        ? null
        : {
          code: `invalid_${collection.toLowerCase()}_${field}`,
          count,
          detail: `[error] ${collection}.${field} has values outside the defined migration mapping.`,
        } satisfies AuditIssue
    }),
    (async () => {
      const count = await database.collection('Tag').countDocuments({
        color: {
          $nin: [
            ...tagColors,
            ...Object.keys(legacyTagColorAliases),
          ],
        },
      })
      return count === 0
        ? null
        : {
          code: 'invalid_tag_color',
          count,
          detail: '[error] Tag.color has values outside the defined migration mapping.',
        } satisfies AuditIssue
    })(),
    (async () => {
      const count = await countMissingSimilarSubmissions(database)
      return count === 0
        ? null
        : {
          code: 'missing_similar_submission',
          count,
          detail: '[warning] Solution.sim_s_id references no Solution.sid and will be migrated as null.',
        } satisfies AuditIssue
    })(),
    (async () => {
      const count = await countInvalidSubmissionIdentifiers(database)
      return count === 0
        ? null
        : {
          code: 'invalid_submission_identifier',
          count,
          detail: '[warning] Solution.sid or Solution.pid is not a positive integer and will be skipped.',
        } satisfies AuditIssue
    })(),
    (async () => {
      const count = await countMissingSubmissionContests(database)
      return count === 0
        ? null
        : {
          code: 'missing_submission_contest',
          count,
          detail: '[warning] Solution.mid references no Contest.contestId; migration preserves the submission with a null contestId.',
        } satisfies AuditIssue
    })(),
    ...[ [ 'Course', 'joinCode' ] ].map(async ([ collection, field ]) => {
      const count = await countMissingField(database, collection, field)
      return count === 0
        ? null
        : {
          code: `missing_${collection.toLowerCase()}_${field}`,
          count,
          detail: `[warning] ${collection}.${field} is absent and will require a migration default.`,
        } satisfies AuditIssue
    }),
  ])).filter((issue): issue is AuditIssue => issue !== null)

  return {
    issues,
    summary: {
      errorCount: issues.filter(issue => issue.detail.startsWith('[error]')).length,
      warningCount: issues.filter(issue => issue.detail.startsWith('[warning]')).length,
    },
  }
}

export function objectIdToString (objectId: ObjectId): string {
  return objectId.toHexString()
}
