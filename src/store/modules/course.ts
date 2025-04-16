import { defineStore } from 'pinia'
import api from '@/api'
import type { Course } from '@/types'

export const useCourseStore = defineStore('course', {
  state: () => ({
    total: 0,
    list: [] as Course[],
    course: {} as Course,
  }),
  actions: {
    async create (course: Partial<Course>): Promise<number> {
      const { data } = await api.course.create(course)
      return data.id
    },
    async find (params: { page: number, pageSize: number }) {
      const { data } = await api.course.find(params)
      this.list = data.docs
      this.total = data.total
    },
    async findOne (id: number) {
      const { data } = await api.course.findOne(id)
      this.course = data
    },
  },
})
