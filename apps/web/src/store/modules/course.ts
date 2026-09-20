import type {
  CourseCreatePayload,
  CourseDetailQueryResult,
  CourseEntityPreview,
  CourseListQuery,
  Paginated,
} from '@putong-oj/shared'
import { defineStore } from 'pinia'
import { createCourse, findCourses, getCourse } from '@/api/course'

export const useCourseStore = defineStore('course', {
  state: () => ({
    course: {} as CourseDetailQueryResult,
    courses: { docs: [], limit: 0, page: 1, pages: 0, total: 0 } as Paginated<CourseEntityPreview>,
  }),
  actions: {
    async createCourse (course: CourseCreatePayload): Promise<number> {
      const response = await createCourse(course)
      if (!response.success) {
        throw new Error(response.message)
      }
      return response.data.courseId
    },
    async findCourses (params: CourseListQuery) {
      const response = await findCourses(params)
      if (response.success) {
        this.courses = response.data
      }
    },
    async findCourse (courseId: number) {
      const response = await getCourse(courseId)
      if (response.success) {
        this.course = response.data
      }
    },
  },
})
