import type { CourseCreatePayload, CourseDetailQueryResult, CourseListQueryResult } from '@putongoj/shared'
import { defineStore } from 'pinia'
import { createCourse, findCourses, getCourse } from '@/api/course'

export const useCourseStore = defineStore('course', {
  state: () => ({
    course: null as CourseDetailQueryResult | null,
    courses: {
      items: [],
      page: 1,
      pageSize: 30,
      total: 0,
    } as CourseListQueryResult,
  }),
  actions: {
    async createCourse (payload: CourseCreatePayload) {
      return createCourse(payload)
    },
    async findCourses (params: { page: number, pageSize: number }) {
      const response = await findCourses(params)
      if (response.success) {
        this.courses = response.data
      }
      return response
    },
    async getCourse (courseId: number) {
      const response = await getCourse(courseId)
      if (response.success) {
        this.course = response.data
      }
      return response
    },
  },
})
