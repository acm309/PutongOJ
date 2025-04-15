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
    async find (params: { page: number, pageSize: number }) {
      const { data } = await api.course.find(params)
      this.list = data.docs
      this.total = data.total
    },
    async create (course: Partial<Course>) {
      const { data } = await api.course.create(course)
      this.list.push(data)
      this.total++
    },
  },
})
