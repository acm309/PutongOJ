import type { PaginateOption } from '@backend/types'
import type { ProblemEntity, SolutionEntityPreview } from '@backend/types/entity'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'

export const useStatisticsStore = defineStore('statistics', () => {
  const list = ref([] as Omit<SolutionEntityPreview, 'pid' | 'judge'>[])
  const countList = ref([] as number[])
  const sumStatis = ref(0 as number)

  async function find (payload: Pick<ProblemEntity, 'pid'> & PaginateOption) {
    const { pid, page, pageSize } = payload
    const { data } = await api.problem.getStatistics(pid, { page, pageSize })

    list.value = data.list.docs
    countList.value = data.group
    sumStatis.value = data.list.total
  }
  return {
    list,
    countList,
    sumStatis,
    find,
  }
})
