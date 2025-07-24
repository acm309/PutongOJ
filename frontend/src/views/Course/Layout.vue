<script setup lang="ts">
import { courseRoleNone } from '@backend/utils/constants'
import { spacing } from 'pangu'
import { storeToRefs } from 'pinia'
import { Auth, Button, ButtonGroup, Col, Divider, Exception, Row, Spin, TabPane, Tabs } from 'view-ui-plus'
import { computed, onBeforeMount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useCourseStore } from '@/store/modules/course'
import { onProfileUpdate } from '@/util/helper'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()
const { findCourse } = courseStore
const { course } = storeToRefs(courseStore)

const loading = ref(false)
const displayTab = computed(() => route.name as string || 'courseProblems')
const courseId = computed(() => Number.parseInt(route.params.id as string))
const role = computed(() => {
  if (course.value?.courseId !== courseId.value) {
    return courseRoleNone
  }
  return course.value?.role ?? courseRoleNone
})

function handleClick (name: string) {
  if (name !== displayTab.value)
    router.push({ name, params: { id: courseId.value } })
}

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

function createProblem () {
  router.push({ name: 'problemCreate', query: { course: courseId.value } })
}
function createContest () {
  router.push({ name: 'contestCreate', query: { course: courseId.value } })
}

const home = () => router.push({ name: 'home' })
const back = () => router.go(-1)

onBeforeMount(fetch)
onProfileUpdate(fetch)
</script>

<template>
  <div class="course-wrap" :class="{ 'course-wrap-edit': displayTab === 'courseSettings' }">
    <Row class="course-header">
      <Col flex="auto" class="course-header-col">
        <h1 class="course-name">
          {{ spacing(course.name) }}
        </h1>
        <p v-if="course.description?.trim()" class="course-description">
          {{ spacing(course.description) }}
        </p>
        <p v-else class="course-description">
          <i>No description found yet...</i>
        </p>
      </Col>
      <Col flex="none" class="course-header-col">
        <ButtonGroup>
          <Button v-if="role.manageProblem" @click="createProblem">
            <Icon type="md-add" />
            Create Problem
          </Button>
          <Button v-if="role.manageContest" @click="createContest">
            <Icon type="md-add" />
            Create Contest
          </Button>
        </ButtonGroup>
      </Col>
    </Row>
    <Auth :authority="role.basic">
      <Tabs class="course-tabs" :model-value="displayTab" @on-click="handleClick">
        <TabPane label="Problem" name="courseProblems" />
        <TabPane label="Contest" name="courseContests" />
        <TabPane v-if="role.manageCourse" label="Member" name="courseMembers" />
        <TabPane v-if="role.manageCourse" label="Setting" name="courseSettings" />
      </Tabs>
      <router-view class="course-children" />
      <template #noMatch>
        <Divider class="exception-divider" />
        <Exception
          class="exception-box"
          type="403" desc="You have no permission to access this course."
        >
          <template #actions>
            <Button type="primary" size="large" @click="home">
              {{ t('oj.go_home') }}
            </Button>
            <Button type="primary" size="large" @click="back">
              {{ t('oj.go_back') }}
            </Button>
          </template>
        </Exception>
      </template>
    </Auth>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
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
