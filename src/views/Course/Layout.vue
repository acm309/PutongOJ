<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Auth, Divider, Exception, Spin, TabPane, Tabs } from 'view-ui-plus'
import { onBeforeMount } from 'vue'
import { spacing } from 'pangu'
import { useCourseStore } from '@/store/modules/course'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()
const { findCourse } = courseStore
const { course } = $(storeToRefs(courseStore))

let loading = $ref(false)
const display = $computed(() => route.name)

function handleClick (name: string) {
  if (name !== display)
    router.push({ name, params: { id: route.params.id } })
}

async function fetch () {
  const id = Number.parseInt(route.params.id as string)
  loading = true
  await findCourse(id)
  loading = false

  if (route.name === 'course') {
    router.push({ name: 'courseMember', params: { id } })
  }
}

const home = () => router.push({ name: 'home' })
const back = () => router.go(-1)

onBeforeMount(fetch)
</script>

<template>
  <div class="course-wrap">
    <div class="course-header">
      <h1 class="course-name">
        {{ spacing(course.name) }}
      </h1>
      <p v-if="course.description?.trim()" class="course-description">
        {{ spacing(course.description) }}
      </p>
      <p v-else class="course-description">
        <i>No description found yet...</i>
      </p>
    </div>
    <Auth :authority="!!course.role?.basic">
      <Tabs class="course-tabs" :model-value="display" @on-click="handleClick">
        <TabPane label="Problem" name="courseProblem" />
        <TabPane label="Contest" name="courseContest" />
        <TabPane label="Member" name="courseMember" />
        <TabPane label="Setting" name="courseSetting" />
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
    padding 0 40px
  .ivu-tabs-nav-scrollable
    .ivu-tabs-nav-scroll
      padding 0 !important

@media screen and (max-width: 1024px)
  .course-tabs
    .ivu-tabs-nav-scroll
      padding 0 20px
</style>

<style lang="stylus" scoped>
.course-wrap
  padding 0
.course-tabs
  padding-top 24px
  margin-bottom 24px
.course-children
  padding 0 0 40px
  position relative

.course-header
  padding 40px 40px 0
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
