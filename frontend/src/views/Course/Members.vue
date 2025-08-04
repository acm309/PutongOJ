<script setup lang="ts">
import type { CourseMemberView } from '@backend/types/entity'
import type { Message, Modal } from 'view-ui-plus'
import type { UserPrivilege } from '@/types'
import { storeToRefs } from 'pinia'
import { Button, Checkbox, Icon, Page, Spin, Tag, Tooltip } from 'view-ui-plus'
import { inject, onBeforeMount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import CourseRoleEdit from '@/components/CourseRoleEdit.vue'
import { useRootStore } from '@/store'
import { useSessionStore } from '@/store/modules/session'
import { courseRoleFields } from '@/util/constant'
import { timePretty } from '@/util/formate'
import { onRouteQueryUpdate } from '@/util/helper'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { course } = api
const rootStore = useRootStore()
const sessionStore = useSessionStore()
const { privilege } = $(storeToRefs(rootStore))
const { isAdmin, profile } = $(storeToRefs(sessionStore))
const modal = inject('$Modal') as typeof Modal
const message = inject('$Message') as typeof Message

const DEFAULT_PAGE_SIZE = 30
const MAX_PAGE_SIZE = 100

const page = $computed<number>(() =>
  Math.max(Number.parseInt(route.query.page as string) || 1, 1))
const pageSize = $computed<number>(() =>
  Math.max(Math.min(Number.parseInt(route.query.pageSize as string)
    || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE), 1))
const id = Number.parseInt(route.params.id as string)

let docs: CourseMemberView[] = $ref([])
let total: number = $ref(0)
let loading: boolean = $ref(false)
let openEdit: boolean = $ref(false)
let editUserId: string = $ref('')

async function fetch () {
  loading = true
  const { data } = await course.findMembers(id, { page, pageSize })
  docs = data.docs
  total = data.total
  loading = false
}

function pageChange (page: number) {
  router.push({
    name: 'courseMembers',
    query: { page, pageSize },
  })
}

function openEditDialog (userId: string) {
  editUserId = userId
  openEdit = true
}

function removeMember (userId: string) {
  modal.confirm({
    title: t('oj.delete'),
    content: 'Are you sure to delete this member?',
    okText: t('oj.ok'),
    cancelText: t('oj.cancel'),
    onOk () {
      course.removeMember(id, userId).then(() => {
        message.success('Delete member successfully')
        fetch()
      })
    },
  })
}

watch(() => openEdit, (val: boolean) => {
  if (val) return
  editUserId = ''
  fetch()
})

onBeforeMount(fetch)
onRouteQueryUpdate(fetch)
</script>

<template>
  <div>
    <div class="members-header">
      <Page
        class="members-page-table" :model-value="page" :total="total" :page-size="pageSize" show-elevator
        @on-change="pageChange"
      />
      <Page
        class="members-page-simple" simple :model-value="page" :total="total" :page-size="pageSize" show-elevator
        @on-change="pageChange"
      />
      <div class="members-action">
        <Button type="primary" class="filter-button" @click="openEdit = true">
          {{ t('oj.add') }}
        </Button>
      </div>
    </div>
    <div class="members-table-container">
      <table class="members-table">
        <thead>
          <tr>
            <th class="member-username">
              {{ t('oj.username') }}
            </th>
            <th class="member-nick">
              {{ t('oj.nick') }}
            </th>
            <td class="member-role">
              <Tooltip content="Basic View" placement="top">
                <Icon type="md-eye" class="role-icon" />
              </Tooltip>
            </td>
            <td class="member-role">
              <Tooltip content="View Testcases" placement="top">
                <Icon type="md-list-box" class="role-icon" />
              </Tooltip>
            </td>
            <td class="member-role">
              <Tooltip content="View Solutions" placement="top">
                <Icon type="md-code-download" class="role-icon" />
              </Tooltip>
            </td>
            <td class="member-role">
              <Tooltip content="Manage Problems" placement="top">
                <Icon type="md-apps" class="role-icon" />
              </Tooltip>
            </td>
            <td class="member-role">
              <Tooltip content="Manage Contests" placement="top">
                <Icon type="md-trophy" class="role-icon" />
              </Tooltip>
            </td>
            <td class="member-role">
              <Tooltip content="Manage Course" placement="top">
                <Icon type="md-filing" class="role-icon" />
              </Tooltip>
            </td>
            <th class="member-update">
              Last Update Time
            </th>
            <th class="member-action">
              {{ t('oj.action') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="docs.length === 0" class="members-empty">
            <td colspan="10">
              <Icon type="ios-planet-outline" class="empty-icon" />
              <span class="empty-text">{{ t('oj.empty_content') }}</span>
            </td>
          </tr>
          <tr v-for="doc in docs" :key="doc.user.uid">
            <td class="member-username">
              <router-link :to="{ name: 'userProfile', params: { uid: doc.user.uid } }">
                {{ doc.user.uid }}
              </router-link>
            </td>
            <td class="member-nick">
              <span v-if="doc.user.nick?.trim()">{{ doc.user.nick }}</span>
            </td>
            <td
              v-if="([privilege.Admin, privilege.Root] as UserPrivilege[]).includes(doc.user.privilege as UserPrivilege)"
              colspan="6"
            >
              <Tooltip placement="top">
                <template #content>
                  <p>This user is an admin, will not limited</p>
                  <p>by the course role setting here.</p>
                </template>
                <Tag v-if="doc.user.privilege === privilege.Admin" class="privilege-tag" color="cyan">
                  Admin
                </Tag>
                <Tag v-else-if="doc.user.privilege === privilege.Root" class="privilege-tag" color="gold">
                  Root
                </Tag>
              </Tooltip>
            </td>
            <template v-else>
              <td v-for="field in courseRoleFields" :key="field" class="member-role">
                <Checkbox v-model="doc.role[field]" class="role-checkbox" disabled />
              </td>
            </template>
            <td class="member-update">
              {{ timePretty(doc.updatedAt) }}
            </td>
            <td class="member-action">
              <template v-if="isAdmin || doc.user.uid !== profile?.uid">
                <span class="role-action" @click="() => openEditDialog(doc.user.uid)">{{ t('oj.edit') }}</span>
                <span class="role-action" @click="() => removeMember(doc.user.uid)">{{ t('oj.delete') }}</span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="members-footer">
      <Page
        class="members-page-table" :model-value="page" :total="total" :page-size="pageSize" show-elevator show-total
        @on-change="pageChange"
      />
      <Page
        class="members-page-mobile" size="small" :model-value="page" :total="total" :page-size="pageSize" show-elevator
        show-total @on-change="pageChange"
      />
    </div>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
    <CourseRoleEdit v-model="openEdit" :course-id="id" :user-id="editUserId" />
  </div>
</template>

<style lang="stylus" scoped>
@import '../../styles/common'

.members-header
  padding 0 40px
  margin-bottom 25px
  display flex
  justify-content space-between
  align-items center
.members-page-simple, .members-page-mobile
  display none
.members-action
  display flex
  align-items center
  > *
    margin-left 4px

@media screen and (max-width: 1024px)
  .members-header
    padding 0 20px
    margin-bottom 5px
    .members-page-table
      display none
    .members-page-simple
      display block
  .members-footer
    padding 0 20px
    margin-top 20px !important

@media screen and (max-width: 768px)
  .members-page-table
    display none !important
  .members-page-mobile
    display block

.members-table-container
  overflow-x auto
  width 100%
.members-table
  width 100%
  min-width 1022px
  table-layout fixed
  th, td
    padding 0 16px
  tbody tr
    transition background-color 0.2s ease
    &:hover
      background-color #f7f7f7

.member-username
  padding-left 40px !important
  width 200px
  max-width 170px
  text-align left
  white-space nowrap
  text-overflow ellipsis
  overflow hidden
.member-nick
  white-space nowrap
  text-overflow ellipsis
  overflow hidden
.member-role
  width 48px
  text-align center
  .role-checkbox
    margin 0 0 2px
  .role-icon
    font-size 18px
.member-update
  width 180px
  text-align center
.member-action
  width 140px
  text-align right
  padding-right 40px !important
  .role-action
    margin-left 16px
    color var(--oj-primary-color)
    cursor pointer
  .role-action:first-child
    margin-left 0
.privilege-tag
  margin 0 0 4px

.members-empty
  &:hover
    background-color transparent !important
  td
    margin-bottom 20px
    padding 32px !important
    border-radius 4px
    text-align center
    .empty-icon
      display block
      font-size 32px

.members-footer
  padding 0 40px
  margin-top 40px
  text-align center
</style>
