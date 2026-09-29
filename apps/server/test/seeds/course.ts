import type { CourseEntity } from '@putong-oj/shared'
import { encrypt } from '../../src/utils/constants.ts'

const courseSeeds: Partial<CourseEntity>[] = [
  {
    name: 'Java Basics',
    description: 'An introduction to Java programming.',
    encrypt: encrypt.Public,
  }, {
    name: 'Advanced Python',
    description: 'A deep dive into advanced Python concepts.',
    encrypt: encrypt.Private,
  } ]

export { courseSeeds }
