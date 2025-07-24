import type { CourseRole, Paginated } from '@backend/types'
import type { CourseEntityEditable, CourseEntityPreview, CourseEntityView } from '@backend/types/entity'
import type { PaginateParams } from '@/types/api'
import { defineStore } from 'pinia'
import api from '@/api'

export const useCourseStore = defineStore('course', {
  state: () => ({
    course: {} as CourseEntityView & { role: CourseRole },
    courses: {} as Paginated<CourseEntityPreview>,
  }),
  actions: {
    async createCourse (course: CourseEntityEditable): Promise<number> {
      const { data } = await api.course.createCourse(course)
      return data.courseId
    },
    async findCourses (params: PaginateParams) {
      const { data } = await api.course.findCourses(params)
      this.courses = data
    },
    async findCourse (courseId: number) {
      const { data } = await api.course.getCourse(courseId)
      this.course = data
    },
  },
})
