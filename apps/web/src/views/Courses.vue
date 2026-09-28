<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Paginator from 'primevue/paginator'
import Tag from 'primevue/tag'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import CourseCreate from '@/components/CourseCreate.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useDebouncedSearch } from '@/composables/useDebouncedSearch'
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
const keyword = ref(String(route.query.keyword || ''))
const createDialogVisible = ref(false)

async function fetch () {
  keyword.value = String(route.query.keyword || '')
  loading.value = true
  await findCourses({
    page: page.value,
    pageSize: pageSize.value,
    keyword: keyword.value.trim() || undefined,
  })
  loading.value = false
}

function applySearch () {
  router.push({
    name: 'courses',
    query: {
      ...route.query,
      keyword: keyword.value.trim() || undefined,
      page: undefined,
    },
  })
}

const {
  searchNow: onSearch,
  searchLater: onKeywordInput,
  cancelSearch,
} = useDebouncedSearch(applySearch)

function onReset () {
  cancelSearch()
  router.push({
    name: 'courses',
    query: {
      ...route.query,
      keyword: undefined,
      page: undefined,
    },
  })
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
    <PageHeader icon="pi pi-book" :title="t('oj.course')">
      <template #action>
        <Button
          v-if="isRoot" icon="pi pi-plus" :label="t('oj.course_create')" :disabled="loading"
          @click="createDialogVisible = true"
        />
      </template>

      <template #toolbar>
        <div class="gap-4 grid grid-cols-1 items-end md:grid-cols-2">
          <IconField>
            <InputIcon class="pi pi-search text-(--p-text-secondary-color)" />
            <InputText
              v-model="keyword" fluid :placeholder="t('ptoj.search_by_title')" maxlength="80"
              @input="onKeywordInput" @keypress.enter="onSearch"
            />
          </IconField>

          <div class="flex gap-2 items-center justify-end">
            <Button icon="pi pi-refresh" severity="secondary" outlined :disabled="loading" @click="fetch" />
            <Button
              icon="pi pi-filter-slash" severity="secondary" outlined :disabled="loading || !keyword.trim()"
              @click="onReset"
            />
          </div>
        </div>
      </template>
    </PageHeader>

    <template v-if="loading || courses.total === 0">
      <div class="border-surface border-t flex gap-4 items-center justify-center px-6 py-24">
        <i v-if="loading" class="pi pi-spin pi-spinner text-2xl" />
        <span>{{ loading ? t('ptoj.loading') : t('ptoj.empty_content_desc') }}</span>
      </div>
    </template>

    <template v-else>
      <div v-for="item in courses.docs" :key="item.courseId" class="border-surface border-t p-2">
        <RouterLink
          :to="{ name: 'courseProblems', params: { id: item.courseId } }"
          class="block group px-4 py-3 space-y-2"
        >
          <div class="flex flex-row gap-2 justify-between">
            <p
              class="font-medium group-hover:text-primary overflow-hidden text-ellipsis text-lg text-pretty transition-colors"
            >
              {{ item.name }}
            </p>
            <div>
              <Tag v-if="item.encrypt === encrypt.Public" :value="t('ptoj.public')" severity="success" />
              <Tag v-else :value="t('ptoj.private')" severity="warn" />
            </div>
          </div>
          <p class="overflow-hidden text-ellipsis text-muted-color text-sm">
            {{ item.description?.trim() || t('oj.no_description') }}
          </p>
        </RouterLink>
      </div>
    </template>

    <Paginator
      class="border-surface border-t bottom-0 md:rounded-b-xl overflow-hidden sticky z-10"
      :first="(page - 1) * pageSize" :rows="pageSize" :total-records="courses.total"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      :current-page-report-template="t('ptoj.paginator_report')" @page="onPage"
    />

    <CourseCreate v-if="isRoot" v-model:visible="createDialogVisible" />
  </div>
</template>
