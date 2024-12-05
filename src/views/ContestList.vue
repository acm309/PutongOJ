<script setup>
import only from 'only'
import { storeToRefs } from 'pinia'
import { inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Input } from 'view-ui-plus'
import { useI18n } from 'vue-i18n'
import { onRouteQueryUpdate, purify } from '../util/helper'
import constant from '../util/constant'
import { useSessionStore } from '@/store/modules/session'
import { useContestStore } from '@/store/modules/contest'
import { useRootStore } from '@/store'
import { timePretty } from '@/util/formate'

const { t } = useI18n()
const { 'contestType': type, 'status': contestVisible } = constant
const contestStore = useContestStore()
const sessionStore = useSessionStore()
const rootStore = useRootStore()
const route = useRoute()
const router = useRouter()

const { list, sum } = $(storeToRefs(contestStore))
const { status, encrypt, currentTime } = $(storeToRefs(rootStore))
const { profile, isLogined, isAdmin, canRemove } = $(storeToRefs(sessionStore))
const page = $computed(() => Number.parseInt(route.query.page) || 1)
const pageSize = $computed(() => Number.parseInt(route.query.pageSize) || 20)
const $Message = inject('$Message')
const $Modal = inject('$Modal')
let enterPwd = $ref('')
const query = $computed(() => purify({ page, pageSize }))
const contestTitle = $ref('')

const { find, verify, update, 'delete': remove } = contestStore
const fetch = () => find(query)

function reload (payload = {}) {
  router.push({
    name: 'contestList',
    query: Object.assign({}, query, payload),
  })
}

const pageChange = val => reload({ page: val })

async function enter (item) {
  const opt = Object.assign(
    only(item, 'cid'),
    { pwd: enterPwd },
  )
  const data = await verify(opt)
  if (data)
    router.push({ name: 'contestOverview', params: { cid: item.cid } })
  else
    $Message.error('Wrong password!')
}

async function visit (item) {
  if (!isLogined) {
    sessionStore.toggleLoginState()
  } else if (isAdmin || profile.verifyContest.includes(+item.cid)) {
    router.push({ name: 'contestOverview', params: { cid: item.cid } })
  } else if (item.start > currentTime) {
    $Message.error('This contest hasn\'t started yet!')
  } else if (+item.encrypt === encrypt.Public) {
    router.push({ name: 'contestOverview', params: { cid: item.cid } })
  } else if (+item.encrypt === encrypt.Private) {
    const data = await verify(only(item, 'cid'))
    if (data)
      router.push({ name: 'contestOverview', params: { cid: item.cid } })
    else
      $Message.error('You\'re not invited to attend this contest!')
  } else if (+item.encrypt === encrypt.Password) {
    $Modal.confirm({
      render: (h) => {
        return h(Input, {
          placeholder: 'Please enter password.',
          onChange: event => enterPwd = event.target.value,
          onEnter: () => {
            enter(item)
            $Modal.remove()
          },
        })
      },
      onOk: () => {
        enter(item)
      },
    })
  }
}

async function change (contest) {
  contest.status = contest.status === status.Reserve
    ? status.Available
    : status.Reserve
  await update(contest)
  find(query)
}

function del (cid) {
  $Modal.confirm({
    title: '提示',
    content: '<p>此操作将永久删除该文件, 是否继续?</p>',
    onOk: async () => {
      await remove({ cid })
      $Message.success(`成功删除 ${cid}！`)
    },
    onCancel: () => $Message.info('已取消删除！'),
  })
}

function search () {
  find(Object.assign({}, query, {
    type: 'title',
    content: contestTitle,
  }))
}

fetch()
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="con-wrap">
    <Row>
      <Col span="16" order="1" />
      <Col span="6" order="2" class="ivu-pr-8">
        <Input v-model="contestTitle" :placeholder="t('oj.title')" />
      </Col>
      <Col span="2" order="3">
        <Button type="primary" @click="search">
          {{ t('oj.search') }}
        </Button>
      </Col>
    </Row>
    <table>
      <tr>
        <th>CID</th>
        <th>Title</th>
        <th>Status</th>
        <th>Start Time</th>
        <th>Type</th>
        <th v-if="isAdmin">
          Visible
        </th>
        <th v-if="isAdmin && canRemove">
          Delete
        </th>
      </tr>
      <template v-for="(item, index) in list">
        <tr v-if="isAdmin || item.status === status.Available" :key="index">
          <td>{{ item.cid }}</td>
          <td>
            <Button type="text" @click="visit(item)">
              {{ item.title }}
            </Button>
            <Tooltip content="This item is reserved, no one could see this, except admin" placement="right">
              <strong v-show="item.status === status.Reserve">Reserved</strong>
            </Tooltip>
          </td>
          <td>
            <span v-if="item.start > currentTime" class="ready">Ready</span>
            <span v-if="item.start < currentTime && item.end > currentTime" class="run">Running</span>
            <span v-if="item.end < currentTime" class="end">Ended</span>
          </td>
          <td>
            <span>{{ timePretty(item.start) }}</span>
          </td>
          <td>
            <span :class="{ password: +item.encrypt === encrypt.Password, private: +item.encrypt === encrypt.Private, public: +item.encrypt === encrypt.Public }">
              {{ type[item.encrypt] }}
            </span>
          </td>
          <td v-if="isAdmin">
            <Tooltip content="Click to change status" placement="right">
              <Button type="text" @click="change(item)">
                {{ contestVisible[item.status] }}
              </Button>
            </Tooltip>
          </td>
          <td v-if="isAdmin && canRemove">
            <Button type="text" @click="del(item.cid)">
              Delete
            </Button>
          </td>
        </tr>
      </template>
    </table>
    <Page
      :model-value="page"
      :total="sum"
      :page-size="pageSize"
      show-elevator
      @on-change="pageChange"
    />
  </div>
</template>

<style lang="stylus" scoped>
@import '../styles/common'

.con-wrap
  margin-bottom: 20px
  table
    margin-bottom: 20px
    th:nth-child(1)
      padding-left: 30px
      width: 5%
    th:nth-child(2)
      width: 30%
    th:nth-child(3)
      width: 10%
    th:nth-child(4)
      width: 15%
    th:nth-child(5)
      width: 10%
    th:nth-child(6)
      width: 10%
    th:nth-child(7)
      width: 10%
    td:nth-child(1)
      padding-left: 30px
  .ready
    font-weight: bold
    color: blue
  .run
    font-weight: bold
    color: red
  .end
    font-weight: bold
    color: black
  .public
    font-weight: 500
  .password
    color: green
    font-weight: 500
  .private
    color: red
    font-weight: 500
</style>
