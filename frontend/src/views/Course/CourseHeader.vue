<script setup lang="ts">
import { courseRoleNone } from '@backend/utils/constants'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import ButtonGroup from 'primevue/buttongroup'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import Tabs from 'primevue/tabs'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ContestCreateDialog from '@/components/ContestCreateDialog.vue'
import CourseProblemAdd from '@/components/CourseProblemAdd.vue'
import { useCourseStore } from '@/store/modules/course'
import { useSessionStore } from '@/store/modules/session'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()
const sessionStore = useSessionStore()
const { course } = storeToRefs(courseStore)
const { isAdmin } = storeToRefs(sessionStore)

const displayTab = computed(() => route.name as string || 'courseProblems')
const courseId = computed(() => Number.parseInt(route.params.id as string))
const courseLoaded = computed(() => course.value?.courseId === courseId.value)
const role = computed(() => {
  if (course.value?.courseId !== courseId.value) {
    return courseRoleNone
  }
  return course.value?.role ?? courseRoleNone
})

const problemAddModal = ref(false)
const contestCreateDialog = ref(false)

const tabItems = computed(() => {
  const params = { id: courseId.value }
  const items = [
    { label: t('oj.course_problem'), value: 'courseProblems', params },
    { label: t('oj.course_contest'), value: 'courseContests', params },
    { label: t('oj.course_member'), value: 'courseMembers', params, managerRequire: true },
    { label: t('oj.course_setting'), value: 'courseSettings', params, managerRequire: true },
  ]
  return items.filter(item => !item.managerRequire || role.value.manageCourse)
})

function createProblem () {
  router.push({ name: 'problemCreate', query: { course: courseId.value } })
}

function refresh () {
  router.push({
    name: displayTab.value,
    params: { id: courseId.value },
    query: { refresh: Date.now() % 998244353 },
  })
}
</script>

<template>
  <template v-if="courseLoaded">
    <div class="bg-(--p-content-background) border-b border-surface shadow-lg">
      <div class="flex flex-col gap-6 items-start justify-between max-w-7xl md:flex-row mx-auto p-8">
        <div class="flex-1">
          <h1 class="course-name font-semibold mb-3 text-3xl">
            {{ course.name }}
          </h1>
          <p v-if="course.description?.trim()" class="course-description text-base text-muted-color">
            {{ course.description }}
          </p>
          <p v-else class="course-description text-base text-muted-color">
            {{ t('oj.no_description') }}
          </p>
        </div>
        <div v-if="isAdmin || role.manageProblem || role.manageContest" class="flex flex-col gap-2">
          <ButtonGroup v-if="role.manageProblem || role.manageContest">
            <Button v-if="role.manageProblem" severity="secondary" outlined @click="createProblem">
              <i class="pi pi-plus" />
              {{ t('oj.course_create_problem') }}
            </Button>
            <Button v-if="role.manageContest" severity="secondary" outlined @click="contestCreateDialog = true">
              <i class="pi pi-plus" />
              {{ t('oj.course_create_contest') }}
            </Button>
          </ButtonGroup>
          <div v-if="isAdmin" class="flex md:justify-end">
            <Button outlined @click="problemAddModal = true">
              <i class="pi pi-plus" />
              {{ t('oj.course_add_existing_problem') }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="role.basic"
      class="-mt-px bg-(--p-content-background) border-b border-surface pt-px shadow-lg sticky top-0 z-10"
    >
      <Tabs :value="displayTab" class="-mb-px max-w-full mx-auto w-fit">
        <TabList :pt="{ prevButton: 'hidden', nextButton: 'hidden' }">
          <RouterLink v-for="tab in tabItems" :key="tab.label" :to="{ name: tab.value, params: tab.params }">
            <Tab :value="tab.value" class="font-normal text-color">
              <span :class="{ 'text-primary': displayTab === tab.value, 'font-semibold': displayTab === tab.value }">
                {{ tab.label }}
              </span>
            </Tab>
          </RouterLink>
        </TabList>
      </Tabs>
    </div>

    <CourseProblemAdd
      v-if="isAdmin" v-model="problemAddModal" :course-id="course.courseId"
      @close="(added: number) => added > 0 ? refresh() : null"
    />
    <ContestCreateDialog v-model:visible="contestCreateDialog" :course="course.courseId" />
  </template>
</template>
