import type { Course } from '@/types'
import api from '@/api'
import { defineStore } from 'pinia'

export const useCourseStore = defineStore('course', {
  state: () => ({
    total: 0,
    list: [] as Course[],
    course: {} as Course,
  }),
  actions: {
    async createCourse (course: Partial<Course>): Promise<number> {
      const { data } = await api.course.createCourse(course)
      return data.id
    },
    async findCourses (params: { page: number, pageSize: number }) {
      const { data } = await api.course.findCourses(params)
      this.list = data.docs
      this.total = data.total
    },
    async findCourse (courseId: number) {
      const { data } = await api.course.getCourse(courseId)
      this.course = data
    },
  },
})
