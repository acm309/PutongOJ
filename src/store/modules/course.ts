import type { Course, Paginated } from '@/types'
import type { PaginateParams } from '@/types/api'
import { defineStore } from 'pinia'
import api from '@/api'

export const useCourseStore = defineStore('course', {
  state: () => ({
    course: {} as Course,
    courses: {} as Paginated<Course>,
  }),
  actions: {
    async createCourse (course: Partial<Course>): Promise<number> {
      const { data } = await api.course.createCourse(course)
      return data.id
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
