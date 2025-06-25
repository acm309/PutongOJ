<script setup lang="ts">
import { spacing } from 'pangu'
import { storeToRefs } from 'pinia'
import { Button, Card, Col, Icon, Page, Row, Spin, Tag } from 'view-ui-plus'
import { onBeforeMount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import CourseCreate from '@/components/CourseCreate.vue'
import { useRootStore } from '@/store'
import { useCourseStore } from '@/store/modules/course'
import { useSessionStore } from '@/store/modules/session'
import { onRouteQueryUpdate } from '@/util/helper'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const rootStore = useRootStore()
const courseStore = useCourseStore()
const sessionStore = useSessionStore()

const { findCourses } = courseStore
const { toggleLoginState } = sessionStore
const { encrypt } = $(storeToRefs(rootStore))
const { courses } = $(storeToRefs(courseStore))
const { isLogined, isRoot } = $(storeToRefs(sessionStore))

const DEFAULT_PAGE_SIZE = 5
const MAX_PAGE_SIZE = 100

const page = $computed<number>(() =>
  Math.max(Number.parseInt(route.query.page as string) || 1, 1))
const pageSize = $computed<number>(() =>
  Math.max(Math.min(Number.parseInt(route.query.pageSize as string)
    || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE), 1))

let loading = $ref(false)
const openCreate = $ref(false)

async function fetch () {
  loading = true
  await findCourses({ page, pageSize })
  loading = false
}

function pageChange (page: number) {
  router.push({
    name: 'courses',
    query: { page, pageSize },
  })
}

function visit (id: number) {
  if (!isLogined) {
    return toggleLoginState()
  }
  router.push({
    name: 'courseProblems',
    params: { id },
  })
}

onBeforeMount(fetch)
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="courses-wrap">
    <div class="courses-header">
      <span class="courses-title">
        Courses
      </span>
      <div v-if="isRoot" class="courses-actions">
        <Button type="primary" icon="md-add" @click="openCreate = true">
          Create
        </Button>
      </div>
    </div>
    <div v-if="courses.total > 0">
      <Card
        v-for="item in courses.docs" :key="item.id" class="courses-card"
        dis-hover @click="visit(item.id)"
      >
        <Row type="flex" :gutter="16" :wrap="false">
          <Col flex="68px" class="courses-icon">
            <Icon type="md-filing" class="icon-course" />
          </Col>
          <Col flex="auto" class="courses-content">
            <div class="courses-headline">
              <Tag v-if="item.encrypt === encrypt.Public" class="courses-encrypt" color="purple">
                Public
              </Tag>
              <Tag v-if="item.encrypt === encrypt.Private" class="courses-encrypt" color="default">
                Private
              </Tag>
              <span class="courses-title">{{ spacing(item.name) }}</span>
            </div>
            <p v-if="item.description.trim()" class="courses-description">
              {{ spacing(item.description) }}
            </p>
            <p v-else class="courses-description">
              <i>No description found yet...</i>
            </p>
          </Col>
        </Row>
      </Card>
    </div>
    <div v-else class="courses-empty">
      <Icon type="ios-planet-outline" class="empty-icon" />
      <span class="empty-text">{{ t('oj.empty_content') }}</span>
    </div>
    <div class="courses-footer">
      <Page
        class="courses-page-table" :model-value="page"
        :total="courses.total" :page-size="courses.limit" show-elevator
        @on-change="pageChange"
      />
      <Page
        class="courses-page-mobile" :model-value="page" size="small"
        :total="courses.total" :page-size="courses.limit" show-elevator
        @on-change="pageChange"
      />
    </div>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
    <CourseCreate v-if="isRoot" v-model="openCreate" />
  </div>
</template>

<style lang="stylus" scoped>
.courses-wrap
  max-width 1024px

.courses-header
  margin-bottom 20px
  display flex
  justify-content space-between
  align-items end
  .courses-title
    margin -8px 0
    font-size 28px
  .courses-actions
    flex none
    display flex

.courses-card
  margin-bottom 20px
  transition border-color 0.2s ease
  &:hover
    border-color var(--oj-primary-color) !important
    .courses-date
      color var(--oj-primary-color)

.courses-icon
  display flex
  align-items center
  justify-content center
  color var(--oj-primary-color)
  opacity 0.85
  .icon-course
    font-size 32px

.courses-content
  .courses-title
    color var(--oj-primary-color)
    font-size 16px
    margin-top -2px
  .courses-encrypt
    float right
    margin 0 0 0 8px
  .courses-description
    margin-top 7px
    transition color 0.2s ease
    text-align justify

.courses-footer
  margin-top 20px
  .courses-page-table
    display block
  .courses-page-mobile
    display none
    text-align center

.courses-empty
  margin-bottom 20px
  padding 32px
  border 1px solid #dcdee2
  border-radius 4px
  display flex
  align-items center
  justify-content center
  .empty-icon
    font-size 32px
  .empty-text
    margin-left 32px

@media screen and (max-width: 1024px)
  .courses-header
    padding-top 10px

@media screen and (max-width: 768px)
  .courses-page-table
    display none !important
  .courses-page-mobile
    display block !important
  .courses-icon
    display none !important
</style>
