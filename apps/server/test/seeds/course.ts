import type { CourseEntity } from '../../src/types/entity.ts'
import { encrypt } from '../../src/utils/constants.ts'

const courseSeeds: Partial<CourseEntity>[] = [
  {
    courseId: 1,
    name: 'Java Basics',
    description: 'An introduction to Java programming.',
    encrypt: encrypt.Public,
  }, {
    courseId: 2,
    name: 'Advanced Python',
    description: 'A deep dive into advanced Python concepts.',
    encrypt: encrypt.Private,
  } ]

export { courseSeeds }
