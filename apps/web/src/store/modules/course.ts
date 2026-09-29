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
    async createCourse (course: CourseCreatePayload): Promise<string | null> {
      const response = await createCourse(course)
      if (!response.success) {
        return null
      }
      return response.data.id
    },
    async findCourses (params: CourseListQuery) {
      const response = await findCourses(params)
      if (response.success) {
        this.courses = response.data
      }
    },
    async findCourse (courseId: string) {
      const response = await getCourse(courseId)
      if (response.success) {
        this.course = response.data
      }
    },
  },
})
