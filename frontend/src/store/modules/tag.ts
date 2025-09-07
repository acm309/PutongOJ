import type { TagEntityItem, TagEntityPreview, TagEntityView } from '@backend/types/entity'
import { defineStore } from 'pinia'
import api from '@/api'

function groupByColor<T extends { color: string }> (
  items: T[],
): Record<string, T[]> {
  const groups: Record<string, T[]> = {}
  items.forEach((item) => {
    if (!groups[item.color]) {
      groups[item.color] = []
    }
    groups[item.color].push(item)
  })
  return groups
}

export const useTagStore = defineStore('tag', {
  state: () => ({
    tag: {} as TagEntityView,
    tags: [] as TagEntityPreview[],
    tagItems: [] as TagEntityItem[],
  }),
  getters: {
    tagsGroupByColor: (state) => {
      return groupByColor(state.tags)
    },
    tagItemsGroupByColor: (state) => {
      return groupByColor(state.tagItems)
    },
  },
  actions: {
    async findTags () {
      const { data } = await api.tag.findTags()
      this.tags = data
    },
    async findTagItems () {
      const { data } = await api.tag.findTagItems()
      this.tagItems = data
    },
    async findTag (tagId: number) {
      const { data } = await api.tag.getTag(tagId)
      this.tag = data
    },
    async createTag (): Promise<number> {
      const { data } = await api.tag.createTag({
        name: this.tag.name,
        color: this.tag.color,
      })
      return data.tagId
    },
    async updateTag () {
      await api.tag.updateTag(this.tag.tagId, {
        name: this.tag.name,
        color: this.tag.color,
      })
    },
  },
})
