<script setup>
import only from 'only'
import { storeToRefs } from 'pinia'
import { onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import constant from '@/util/constant'
import { onRouteQueryUpdate, purify } from '@/util/helper'
import { useSessionStore } from '@/store/modules/session'
import { useSolutionStore } from '@/store/modules/solution'
import { useContestStore } from '@/store/modules/contest'
import { useRootStore } from '@/store'
import { timePretty } from '@/util/formate'

const { t } = useI18n()
const sessionStore = useSessionStore()
const solutionStore = useSolutionStore()
const contestStore = useContestStore()
const { problems } = $(storeToRefs(contestStore))
const { profile, isAdmin } = $(storeToRefs(sessionStore))
const { list, sum } = $(storeToRefs(solutionStore))
const { find: findSolutions } = solutionStore
const { changeDomTitle } = useRootStore()
const { findOne } = contestStore
const route = useRoute()
const router = useRouter()

let uid = $ref(route.query.uid || '')
let pid = $ref(route.query.pid || '')
let judge = $ref(parseInt(route.query.judge) || '')
let language = $ref(parseInt(route.query.language) || '')
let page = $ref(parseInt(route.query.page) || 1)
let pageSize = $ref(parseInt(route.query.pageSize) || 30)
const mid = $computed(() => route.params.cid || '')

const judgeList = $ref(constant.judgeList)
const languageList = $ref(constant.languageList)
const result = $ref(constant.result)
const lang = $ref(constant.language)
const color = $ref(constant.color)

const query = $computed(() => {
  const opt = Object.assign(
    {},
    only(route.query, 'page pageSize uid pid language judge'),
    {
      mid: route.params.cid,
    },
  )
  if (route.query.pid) {
    opt.pid = problems[parseInt(route.query.pid) - 1]
  }
  return purify(opt)
})

const getId = pid => problems.indexOf(pid) + 1

function fetch () {
  findSolutions(query)
  const routeQuery = route.query
  page = parseInt(routeQuery.page) || 1
  pageSize = parseInt(routeQuery.pageSize) || 30
  uid = routeQuery.uid
  pid = routeQuery.pid || ''
  judge = parseInt(routeQuery.judge) || ''
  language = parseInt(routeQuery.language) || ''
}

function reload (payload = {}) {
  router.push({
    name: 'contestStatus',
    query: purify(Object.assign({}, query, payload)),
  })
}

const search = () => reload({
  page: 1,
  uid,
  pid,
  language,
  judge,
})

const pageChange = val => reload({ page: val })

onBeforeMount(async () => {
  if (problems == null) {
    await findOne({ cid: mid })
  }
  fetch()
  changeDomTitle({ title: `Contest ${route.params.cid}` })
})

onRouteQueryUpdate(fetch)
</script>

<template>
  <div>
    <Row class="filter">
      <Col :offset="1" :span="5">
        <Row>
          <Col :span="6">
            <label>User</label>
          </Col>
          <Col :span="15">
            <Input v-model="uid" placeholder="username" />
          </Col>
        </Row>
      </Col>
      <Col :span="4">
        <Row>
          <Col :span="6">
            <label>Pid</label>
          </Col>
          <Col :span="15">
            <Input v-model="pid" placeholder="pid" />
          </Col>
        </Row>
      </Col>
      <Col :span="6">
        <Row>
          <Col :span="6">
            <label>Judge</label>
          </Col>
          <Col :span="16">
            <Select v-model="judge">
              <Option
                v-for="item in judgeList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </Select>
          </Col>
        </Row>
      </Col>
      <Col :span="4">
        <Row>
          <Col :span="12">
            <label>Language</label>
          </Col>
          <Col :span="12">
            <Select v-model="language">
              <Option
                v-for="item in languageList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </Select>
          </Col>
        </Row>
      </Col>
      <Col :span="3">
        <Button type="primary" icon="ios-search" @click="search">
          {{ t('oj.search') }}
        </Button>
      </Col>
    </Row>
    <Row class="pagination" type="flex" justify="start">
      <Col :span="16">
        <Page v-model:current="page" :total="sum" :page-size="pageSize" show-elevator @on-change="pageChange" />
      </Col>
    </Row>
    <table>
      <tr>
        <th>SID</th>
        <th>PID</th>
        <th>Username</th>
        <th>Judge</th>
        <th>Time/ms</th>
        <th>Memory/kb</th>
        <th>Language</th>
        <th>Submit Time</th>
      </tr>
      <tr v-for="item in list" :key="item.sid">
        <td>{{ item.sid }}</td>
        <td>
          <router-link :to="{ name: 'contestProblem', params: { cid: mid, id: getId(item.pid) } }">
            {{ getId(item.pid) }}
          </router-link>
        </td>
        <td>
          <Button type="text">
            {{ item.uid }}
          </Button>
        </td>
        <td :class="color[item.judge]">
          {{ result[item.judge] }}
          <Tag v-if="item.sim" color="yellow">
            [{{ item.sim }}%]{{ item.sim_s_id }}
          </Tag>
        </td>
        <td>{{ item.time }}</td>
        <td>{{ item.memory }}</td>
        <td v-if="isAdmin || (profile && profile.uid === item.uid)">
          <router-link :to="{ name: 'solution', params: { sid: item.sid } }">
            {{ lang[item.language] }}
          </router-link>
        </td>
        <td v-else>
          {{ lang[item.language] }}
        </td>
        <td>{{ timePretty(item.create) }}</td>
      </tr>
    </table>
  </div>
</template>

<style lang="stylus" scoped>
@import '../../styles/common'

.filter
  margin-bottom: 20px
  label
    height: 32px
    line-height: 32px
  .ivu-col
    text-align: center
    margin-bottom: 0
    font-size: 14px
  .ivu-select-item
    text-align: left
.pagination
  margin-left: 10px
  .ivu-col
    text-align: left
    margin-bottom: 10px
</style>
