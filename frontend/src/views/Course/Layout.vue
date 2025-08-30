<script setup lang="ts">
import type { Message } from 'view-ui-plus'
import { courseRoleNone } from '@backend/utils/constants'
import { AxiosError } from 'axios'
import { spacing } from 'pangu'
import { storeToRefs } from 'pinia'
import { Auth, Button, ButtonGroup, Col, Divider, Exception, Form, FormItem, Input, Modal, Row, Space, Spin, TabPane, Tabs } from 'view-ui-plus'
import { computed, inject, onBeforeMount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import CourseProblemAdd from '@/components/CourseProblemAdd.vue'
import { useCourseStore } from '@/store/modules/course'
import { useSessionStore } from '@/store/modules/session'
import { onProfileUpdate } from '@/util/helper'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()
const sessionStore = useSessionStore()
const { findCourse } = courseStore
const { course } = storeToRefs(courseStore)
const { isAdmin } = storeToRefs(sessionStore)
const message = inject('$Message') as typeof Message

const displayTab = computed(() => route.name as string || 'courseProblems')
const courseId = computed(() => Number.parseInt(route.params.id as string))
const role = computed(() => {
  if (course.value?.courseId !== courseId.value) {
    return courseRoleNone
  }
  return course.value?.role ?? courseRoleNone
})
const loading = ref(false)
const joinModal = ref(false)
const joinFormRef = ref<any>(null)
const joinForm = $ref({
  joinCode: '',
})
const joinFormRules = $computed(() => ({
  joinCode: [
    { required: true, message: t('oj.course_join_code_required'), trigger: 'change' },
  ],
}))
const joining = ref(false)
const problemAddModal = ref(false)

async function fetch () {
  loading.value = true
  await findCourse(courseId.value)
  if (
    !role.value.manageCourse
    && [ 'courseMembers', 'courseSettings' ].includes(displayTab.value)
  ) {
    router.push({ name: 'courseProblems', params: { id: courseId.value } })
  }
  loading.value = false
}

function handleTabClick (name: string) {
  if (name === displayTab.value) {
    return
  }
  router.push({ name, params: { id: courseId.value } })
}
function createProblem () {
  router.push({ name: 'problemCreate', query: { course: courseId.value } })
}
function createContest () {
  router.push({ name: 'contestCreate', query: { course: courseId.value } })
}

async function joinCourse () {
  joinFormRef.value.validate(async (valid: boolean) => {
    if (!valid) {
      message.warning(t('oj.form_invalid'))
      return
    }
    joining.value = true
    try {
      const result = await api.course.joinCourse(courseId.value, joinForm.joinCode)
      if (result.data?.success === true) {
        message.success(t('oj.course_join_success'))
        fetch()
      } else if (result instanceof AxiosError) {
        message.error(t('join_failed', { error: `Failed to join course: ${result.response?.data?.error || result.message}` }))
      } else {
        message.error(t('join_failed', { error: t('oj.unknown_error') }))
      }
      joinModal.value = false
    } catch (e: any) {
      message.error(t('join_failed', { error: e?.message || t('oj.unknown_error') }))
    } finally {
      joining.value = false
    }
  })
}

function refresh () {
  router.push({
    name: displayTab.value,
    params: { id: courseId.value },
    query: { refresh: Date.now() % 998244353 },
  })
}

onBeforeMount(fetch)
onProfileUpdate(fetch)
</script>

<template>
  <div class="course-wrap" :class="{ 'course-wrap-edit': displayTab === 'courseSettings' }">
    <Row class="course-header" justify="end">
      <Col flex="auto" class="course-header-col">
        <h1 class="course-name">
          {{ spacing(course.name) }}
        </h1>
        <p v-if="course.description?.trim()" class="course-description">
          {{ spacing(course.description) }}
        </p>
        <p v-else class="course-description">
          {{ t('oj.no_description') }}
        </p>
      </Col>
      <Col v-if="isAdmin || role.manageProblem || role.manageContest" flex="none" class="course-header-col">
        <Space direction="vertical">
          <ButtonGroup v-if="role.manageProblem || role.manageContest">
            <Button v-if="role.manageProblem" @click="createProblem">
              <Icon type="md-add" />
              {{ t('oj.course_create_problem') }}
            </Button>
            <Button v-if="role.manageContest" @click="createContest">
              <Icon type="md-add" />
              {{ t('oj.course_create_contest') }}
            </Button>
          </ButtonGroup>
          <Button v-if="isAdmin" type="primary" style="float: right;" @click="problemAddModal = true">
            <Icon type="md-add" />
            {{ t('oj.course_add_existing_problem') }}
          </Button>
        </Space>
      </Col>
    </Row>
    <Auth :authority="role.basic">
      <Tabs class="course-tabs" :model-value="displayTab" @on-click="handleTabClick">
        <TabPane :label="t('oj.course_problem')" name="courseProblems" />
        <TabPane :label="t('oj.course_contest')" name="courseContests" />
        <TabPane v-if="role.manageCourse" :label="t('oj.course_member')" name="courseMembers" />
        <TabPane v-if="role.manageCourse" :label="t('oj.course_setting')" name="courseSettings" />
      </Tabs>
      <router-view class="course-children" />
      <template #noMatch>
        <Divider class="exception-divider" />
        <Exception
          class="exception-box" type="403"
          :desc="t('oj.course_private_explanation')"
        >
          <template #actions>
            <Button type="primary" :disabled="!course.canJoin" size="large" @click="joinModal = true">
              <Icon type="md-person-add" />
              {{ t('oj.course_join') }}
            </Button>
            <Button size="large" @click="() => router.go(-1)">
              {{ t('oj.go_back') }}
            </Button>
          </template>
        </Exception>
      </template>
    </Auth>
    <Modal
      v-if="course.canJoin" v-model="joinModal" :loading="joining" :title="t('oj.course_join')" :closable="false"
      @on-cancel="joinModal = false" @on-ok="joinCourse"
    >
      <Form ref="joinFormRef" :model="joinForm" :rules="joinFormRules">
        <FormItem :label="t('oj.course_join_code')" prop="joinCode">
          <Input v-model="joinForm.joinCode" :placeholder="t('oj.course_join_code_placeholder')" />
        </FormItem>
      </Form>
    </Modal>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
    <CourseProblemAdd
      v-if="isAdmin" v-model="problemAddModal" :course-id="course.courseId"
      @close="(added: number) => added > 0 ? refresh() : null"
    />
  </div>
</template>

<style lang="stylus">
.course-tabs
  .ivu-tabs-nav-scroll
    padding 0 25px
  .ivu-tabs-nav-scrollable
    .ivu-tabs-nav-scroll
      padding 0 !important

@media screen and (max-width: 1024px)
  .course-tabs
    .ivu-tabs-nav-scroll
      padding 0 5px
</style>

<style lang="stylus" scoped>
.course-wrap
  padding 0
.course-wrap-edit
  max-width 768px
.course-tabs
  padding-top 24px
  margin-bottom 24px
.course-children
  padding 0 0 40px
  position relative

.course-header
  padding 40px 40px 0
  margin 0 -20px -20px 0
  .course-header-col
    margin 0 20px 20px 0
  .course-name
    font-size 28px
    font-weight 600
    margin-bottom 12px
  .course-description
    font-size 16px
    margin-bottom 0

@media screen and (max-width: 1024px)
  .course-header
    padding 20px 20px 0
  .course-children
    padding 0 0 20px
  .course-tabs
    padding-top 12px
    margin-bottom 4px

.exception-divider
  margin 40px 0 0
.exception-box
  padding 20px
  height 100% !important
  max-width 1024px
@media screen and (max-width: 1024px)
  .exception-divider
    margin 20px 0 0
@media screen and (max-width: 576px)
  .exception-box
    padding-bottom: 100px
</style>
