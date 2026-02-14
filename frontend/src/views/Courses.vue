<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Paginator from 'primevue/paginator'
import Tag from 'primevue/tag'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import CourseCreate from '@/components/CourseCreate.vue'
import { useRootStore } from '@/store'
import { useCourseStore } from '@/store/modules/course'
import { useSessionStore } from '@/store/modules/session'
import { onRouteQueryUpdate } from '@/utils/helper'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const rootStore = useRootStore()
const courseStore = useCourseStore()
const sessionStore = useSessionStore()

const { findCourses } = courseStore
const { encrypt } = storeToRefs(rootStore)
const { courses } = storeToRefs(courseStore)
const { isRoot } = storeToRefs(sessionStore)

const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 100

const page = computed(() =>
  Math.max(Number.parseInt(route.query.page as string) || 1, 1))
const pageSize = computed(() =>
  Math.max(Math.min(Number.parseInt(route.query.pageSize as string)
    || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE), 1))

const loading = ref(false)
const createDialogVisible = ref(false)

async function fetch () {
  loading.value = true
  await findCourses({ page: page.value, pageSize: pageSize.value })
  loading.value = false
}

function onPage (event: any) {
  router.push({
    name: 'courses',
    query: {
      ...route.query,
      page: (event.first / event.rows + 1),
    },
  })
}

onMounted(fetch)
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="max-w-4xl p-0">
    <div class="p-6">
      <div class="flex gap-4 items-center justify-between">
        <div class="flex font-semibold gap-4 items-center">
          <i class="pi pi-book text-2xl" />
          <h1 class="text-xl">
            {{ t('oj.course') }}
          </h1>
        </div>
        <div v-if="isRoot" class="flex gap-2">
          <Button
            icon="pi pi-plus" :label="t('oj.course_create')" :disabled="loading"
            @click="createDialogVisible = true"
          />
        </div>
      </div>
    </div>

    <template v-if="loading || courses.total === 0">
      <div class="border-surface border-t flex gap-4 items-center justify-center px-6 py-24">
        <i v-if="loading" class="pi pi-spin pi-spinner text-2xl" />
        <span>{{ loading ? t('ptoj.loading') : t('ptoj.empty_content_desc') }}</span>
      </div>
    </template>

    <div
      v-for="item in courses.docs" v-else :key="item.courseId"
      class="border-surface border-t flex flex-col gap-2 px-6 py-5 transition-colors"
    >
      <div class="flex flex-row gap-2 items-center justify-between">
        <RouterLink
          class="font-medium hover:text-primary overflow-hidden text-color text-ellipsis text-lg"
          :to="{ name: 'courseProblems', params: { id: item.courseId } }"
        >
          {{ item.name }}
        </RouterLink>
        <div class="flex gap-2">
          <Tag
            :value="item.encrypt === encrypt.Public ? t('ptoj.public') : t('ptoj.private')"
            :severity="item.encrypt === encrypt.Public ? 'success' : 'warn'"
          />
        </div>
      </div>
      <p class="text-muted-color text-sm">
        {{ item.description?.trim() || t('oj.no_description') }}
      </p>
    </div>

    <Paginator
      class="border-surface border-t bottom-0 md:rounded-b-xl overflow-hidden sticky z-10"
      :first="(page - 1) * pageSize" :rows="pageSize" :total-records="courses.total"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      :current-page-report-template="t('ptoj.paginator_report')" @page="onPage"
    />

    <CourseCreate v-if="isRoot" v-model:visible="createDialogVisible" />
  </div>
</template>
