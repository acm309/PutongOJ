<script setup>
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import constant from '@/util/constant'
import { onRouteQueryUpdate, purify } from '@/util/helper'
import { useSessionStore } from '@/store/modules/session'
import { useSolutionStore } from '@/store/modules/solution'
import { timePretty } from '@/util/formate'

const { t } = useI18n()
const sessionStore = useSessionStore()
const solutionStore = useSolutionStore()
const { profile, isAdmin } = $(storeToRefs(sessionStore))
const { list, sum } = $(storeToRefs(solutionStore))
const find = solutionStore.find
const route = useRoute()
const router = useRouter()

const uid = $computed(() => route.query.uid || '')
const pid = $computed(() => route.query.pid || '')
const judge = $computed(() => parseInt(route.query.judge) || '')
const language = $computed(() => parseInt(route.query.language) || '')
const page = $computed(() => parseInt(route.query.page) || 1)
const pageSize = $computed(() => parseInt(route.query.pageSize) || 30)

const judgeList = $ref(constant.judgeList)
const languageList = $ref(constant.languageList)
const result = $ref(constant.result)
const lang = $ref(constant.language)
const color = $ref(constant.color)

const query = $computed(() => purify({ uid, pid, judge, language, page, pageSize }))

const fetch = () => find(query)

const reload = (payload = {}) => {
  router.push({
    name: 'status',
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

fetch()
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="status-wrap">
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
          <Col :span="10">
            <label>Language</label>
          </Col>
          <Col :span="14">
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
      <Col :span="4">
        <Button type="primary" icon="ios-search" @click="search">
          {{ t('oj.search') }}
        </Button>
      </Col>
    </Row>
    <Row class="pagination">
      <Col :span="16">
        <Page :model-value="page" :total="sum" :page-size="pageSize" show-elevator @on-change="pageChange" />
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
          <router-link :to="{ name: 'problemInfo', params: { pid: item.pid } }">
            {{ item.pid }}
          </router-link>
        </td>
        <td>
          <router-link :to="{ name: 'userInfo', params: { uid: item.uid } }">
            <Button type="text">
              {{ item.uid }}
            </Button>
          </router-link>
        </td>
        <td :class="color[item.judge]">
          {{ result[item.judge] }}
          <Tag v-if="item.sim" color="warning">
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
.filter
  margin-bottom: 20px
  label
    height: 32px
    line-height: 32px
  .ivu-col
    text-align: center
  .ivu-select-item
    text-align: left
.pagination
  margin-bottom: 10px
table
  th:nth-child(1)
    width: 8%
  th:nth-child(2)
    width: 8%
  th:nth-child(3)
    width: 10%
  th:nth-child(4)
    width: 15%
  th:nth-child(5)
    width: 8%
  th:nth-child(6)
    width: 8%
  th:nth-child(7)
    width: 8%
  th:nth-child(8)
    width: 15%
</style>
