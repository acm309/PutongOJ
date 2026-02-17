<script setup lang="ts">
import type { CourseMemberView } from '@backend/types/entity'
import type { UserPrivilege } from '@/types'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Paginator from 'primevue/paginator'
import PrimeTag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'
import { computed, onBeforeMount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import CourseRoleEdit from '@/components/CourseRoleEdit.vue'
import { useRootStore } from '@/store'
import { useSessionStore } from '@/store/modules/session'
import { timePretty } from '@/utils/format'
import { onRouteQueryUpdate } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const confirm = useConfirm()
const message = useMessage()
const { course } = api
const rootStore = useRootStore()
const sessionStore = useSessionStore()
const { privilege } = storeToRefs(rootStore)
const { isAdmin, profile } = storeToRefs(sessionStore)

const DEFAULT_PAGE_SIZE = 30
const MAX_PAGE_SIZE = 100

const page = computed<number>(() =>
  Math.max(Number.parseInt(route.query.page as string) || 1, 1))
const pageSize = computed<number>(() =>
  Math.max(Math.min(Number.parseInt(route.query.pageSize as string)
    || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE), 1))
const id = Number.parseInt(route.params.id as string)

const docs = ref<CourseMemberView[]>([])
const total = ref<number>(0)
const loading = ref<boolean>(false)
const openEdit = ref<boolean>(false)
const editUserId = ref<string>('')

async function fetch () {
  loading.value = true
  const { data } = await course.findMembers(id, { page: page.value, pageSize: pageSize.value })
  docs.value = data.docs
  total.value = data.total
  loading.value = false
}

function pageChange (page: number) {
  router.push({
    name: 'courseMembers',
    query: { page, pageSize: pageSize.value },
  })
}

function openEditDialog (userId: string) {
  editUserId.value = userId
  openEdit.value = true
}

function removeMember (event: any, userId: string) {
  confirm.require({
    target: event.currentTarget,
    message: t('oj.course_remove_member_confirm'),
    header: t('oj.delete'),
    rejectProps: {
      label: t('oj.cancel'),
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: t('oj.ok'),
      severity: 'danger',
    },
    accept: async () => {
      await course.removeMember(id, userId)
      message.success(t('oj.course_member_remove_success'))
      fetch()
    },
  })
}

watch(() => openEdit.value, (val: boolean) => {
  if (val) return
  editUserId.value = ''
  fetch()
})

onBeforeMount(fetch)
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="max-w-7xl p-0">
    <div class="border-b border-surface flex justify-end p-6">
      <Button :label="t('oj.add')" icon="pi pi-plus" @click="openEdit = true" />
    </div>

    <DataTable class="-mb-px whitespace-nowrap" :value="docs" :lazy="true" :loading="loading" scrollable>
      <Column class="pl-8 w-52" :header="t('oj.username')">
        <template #body="{ data }">
          <RouterLink :to="{ name: 'UserProfile', params: { uid: data.user.uid } }">
            {{ data.user.uid }}
          </RouterLink>
        </template>
      </Column>

      <Column class="w-52" :header="t('oj.nick')">
        <template #body="{ data }">
          <span v-if="data.user.nick?.trim()">{{ data.user.nick }}</span>
        </template>
      </Column>

      <Column class="text-center w-14">
        <template #header>
          <i v-tooltip.top="t('oj.course_basic_view')" class="pi pi-eye" />
        </template>
        <template #body="{ data }">
          <template
            v-if="([privilege.Admin, privilege.Root] as UserPrivilege[]).includes(data.user.privilege as UserPrivilege)"
          >
            <span />
          </template>
          <Checkbox v-else v-model="data.role.basic" binary disabled />
        </template>
      </Column>

      <Column class="text-center w-14">
        <template #header>
          <i v-tooltip.top="t('oj.course_view_testcase')" class="pi pi-list" />
        </template>
        <template #body="{ data }">
          <template
            v-if="([privilege.Admin, privilege.Root] as UserPrivilege[]).includes(data.user.privilege as UserPrivilege)"
          >
            <span />
          </template>
          <Checkbox v-else v-model="data.role.viewTestcase" binary disabled />
        </template>
      </Column>

      <Column class="text-center w-14">
        <template #header>
          <i v-tooltip.top="t('oj.course_view_solution')" class="pi pi-code" />
        </template>
        <template #body="{ data }">
          <template
            v-if="([privilege.Admin, privilege.Root] as UserPrivilege[]).includes(data.user.privilege as UserPrivilege)"
          >
            <span />
          </template>
          <Checkbox v-else v-model="data.role.viewSolution" binary disabled />
        </template>
      </Column>

      <Column class="text-center w-14">
        <template #header>
          <i v-tooltip.top="t('oj.course_manage_problem')" class="pi pi-th-large" />
        </template>
        <template #body="{ data }">
          <template
            v-if="([privilege.Admin, privilege.Root] as UserPrivilege[]).includes(data.user.privilege as UserPrivilege)"
          >
            <span />
          </template>
          <Checkbox v-else v-model="data.role.manageProblem" binary disabled />
        </template>
      </Column>

      <Column class="text-center w-14">
        <template #header>
          <i v-tooltip.top="t('oj.course_manage_contest')" class="pi pi-trophy" />
        </template>
        <template #body="{ data }">
          <template
            v-if="([privilege.Admin, privilege.Root] as UserPrivilege[]).includes(data.user.privilege as UserPrivilege)"
          >
            <span />
          </template>
          <Checkbox v-else v-model="data.role.manageContest" binary disabled />
        </template>
      </Column>

      <Column class="text-center w-14">
        <template #header>
          <i v-tooltip.top="t('oj.course_manage_course')" class="pi pi-folder" />
        </template>
        <template #body="{ data }">
          <template
            v-if="([privilege.Admin, privilege.Root] as UserPrivilege[]).includes(data.user.privilege as UserPrivilege)"
          >
            <PrimeTag
              v-if="data.user.privilege === privilege.Admin"
              v-tooltip.top="{ value: t('oj.course_admin_override'), pt: { text: 'max-w-64 whitespace-normal' } }"
              severity="info"
            >
              Admin
            </PrimeTag>
            <PrimeTag
              v-else-if="data.user.privilege === privilege.Root"
              v-tooltip.top="{ value: t('oj.course_admin_override'), pt: { text: 'max-w-64 whitespace-normal' } }"
              severity="warn"
            >
              Root
            </PrimeTag>
          </template>
          <Checkbox v-else v-model="data.role.manageCourse" binary disabled />
        </template>
      </Column>

      <Column class="w-44" :header="t('oj.last_update')">
        <template #body="{ data }">
          {{ timePretty(data.updatedAt) }}
        </template>
      </Column>

      <Column class="pr-6 w-32" :header="t('oj.action')">
        <template #body="{ data }">
          <template v-if="isAdmin || data.user.uid !== profile?.uid">
            <Button :label="t('oj.edit')" text size="small" @click="() => openEditDialog(data.user.uid)" />
            <Button
              :label="t('oj.delete')" text severity="danger" size="small"
              @click="event => removeMember(event, data.user.uid)"
            />
          </template>
        </template>
      </Column>

      <template #empty>
        <span class="px-2">
          {{ t('oj.empty_content') }}
        </span>
      </template>
    </DataTable>

    <Paginator
      class="border-surface border-t bottom-0 md:rounded-b-xl overflow-hidden sticky z-10"
      :first="(page - 1) * pageSize" :rows="pageSize" :total-records="total"
      template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      :current-page-report-template="t('ptoj.paginator_report')"
      @page="(event: any) => pageChange(event.first / event.rows + 1)"
    />

    <CourseRoleEdit v-model="openEdit" :course-id="id" :user-id="editUserId" />
  </div>
</template>
