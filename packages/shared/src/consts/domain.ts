import type { CourseRole } from '../types/entity.js'

export const limitation = Object.freeze({
  time: 10 * 1000,
  memory: 256 * 1024,
})

export const status = Object.freeze({
  Reserve: 0,
  Available: 2,
})

export const encrypt = Object.freeze({
  Public: 1,
  Private: 2,
  Password: 3,
})

export const problemType = Object.freeze({
  Traditional: 1,
  Interaction: 2,
  SpecialJudge: 3,
})

export const courseRoleNone = Object.freeze({
  basic: false,
  viewTestcase: false,
  viewSolution: false,
  manageProblem: false,
  manageContest: false,
  manageCourse: false,
} as CourseRole)

export const courseRoleEntire = Object.freeze({
  basic: true,
  viewTestcase: true,
  viewSolution: true,
  manageProblem: true,
  manageContest: true,
  manageCourse: true,
} as CourseRole)
