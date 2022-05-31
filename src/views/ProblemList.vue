<script setup>
import only from 'only'
import { storeToRefs } from 'pinia'
import { inject, onBeforeMount, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onProfileUpdate, onRouteQueryUpdate, purify } from '@/util/helper'
import constant from '@/util/constant'
import { useSessionStore } from '@/store/modules/session'
import { useProblemStore } from '@/store/modules/problem'
import { useRootStore } from '@/store'
import { formate } from '@/util/formate'

const options = reactive([
  {
    value: 'pid',
    label: 'Pid',
  },
  {
    value: 'title',
    label: 'Title',
  },
  {
    value: 'tag',
    label: 'Tag',
  },
])

const route = useRoute()
const router = useRouter()

const query = $computed(() => only(route.query, 'page pageSize type content'))

const type = $ref(query.type || 'pid')
const content = $ref(query.content || '')
const page = $computed(() => parseInt(query.page) || 1)
const pageSize = $computed(() => parseInt(query.pageSize) || 30)
const problemVisible = $ref(constant.status)

const problemStore = useProblemStore()
const rootStore = useRootStore()
const sessionStore = useSessionStore()

const { list, sum, solved } = $(storeToRefs(problemStore))
const { status, judge } = $(storeToRefs(rootStore))
const { isAdmin, canRemove } = $(storeToRefs(sessionStore))
const { find, update, 'delete': remove } = problemStore

function reload (payload = {}) {
  const routeQuery = Object.assign({}, query, purify(payload))
  router.push({ name: 'problemList', query: routeQuery })
}

const fetch = () => find(query)

const search = () => reload({ page: 1, type, content })
const pageChange = val => reload({ page: val })

function change (problem) {
  problem.status = problem.status === status.Reserve
    ? status.Available
    : status.Reserve
  update(problem).then(fetch)
}

const $Message = inject('$Message')
const $Modal = inject('$Modal')

function del (pid) {
  $Modal.confirm({
    title: '提示',
    content: '<p>此操作将永久删除该文件, 是否继续?</p>',
    onOk: async () => {
      await remove({ pid })
      $Message.success(`成功删除 ${pid}！`)
    },
    onCancel: () => {
      $Message.info('已取消删除！')
    },
  })
}

onBeforeMount(fetch)
onRouteQueryUpdate(fetch)
onProfileUpdate(fetch)
</script>

<template>
  <div class="prolist-wrap">
    <Row style="margin-bottom: 20px">
      <Col span="16">
        <Page :model-value="page" :total="sum" :page-size="pageSize" show-elevator @on-change="pageChange" />
      </Col>
      <Col :span="2">
        <Select v-model="type">
          <Option v-for="item in options" :key="item.value" :value="item.value">
            {{ item.label }}
          </Option>
        </Select>
      </Col>
      <Col :span="4">
        <Input v-model="content" icon="search" placeholder="Please input..." @keyup.enter="search" />
      </Col>
      <Col :span="2">
        <Button type="primary" @click="search">
          Search
        </Button>
      </Col>
    </Row>
    <table>
      <tr>
        <th>#</th>
        <th>PID</th>
        <th>Title</th>
        <th>Ratio</th>
        <th>Tags</th>
        <th v-if="isAdmin">
          Visible
        </th>
        <th v-if="isAdmin && canRemove">
          Delete
        </th>
      </tr>
      <template v-for="item in list" :key="item.pid">
        <tr v-if="isAdmin || item.status === status.Available" :key="item.pid">
          <td>
            <Icon v-if="solved.includes(item.pid)" type="md-checkmark" />
          </td>
          <td>{{ item.pid }}</td>
          <td>
            <router-link :to="{ name: 'problemInfo', params: { pid: item.pid } }">
              <Button type="text">
                {{ item.title }}
              </Button>
            </router-link>
          </td>
          <Tooltip content="This item is reserved, no one could see this, except admin" placement="right">
            <strong v-show="item.status === status.Reserve">Reserved</strong>
          </Tooltip>
          <td>
            <span>{{ formate(item.solve / (item.submit + 0.000001)) }}</span>&nbsp;
            (<router-link :to="{ name: 'status', query: { pid: item.pid, judge: judge.Accepted } }">
              <Button type="text">
                {{ item.solve }}
              </Button>
            </router-link> /
            <router-link :to="{ name: 'status', query: { pid: item.pid } }">
              <Button type="text">
                {{ item.submit }}
              </Button>
            </router-link>)
          </td>
          <td>
            <template v-for="(item2, index2) in item.tags" :key="index2">
              <router-link :to="{ name: 'problemList', query: { type: 'tag', content: item2 } }">
                <Tag>{{ item2 }}</Tag>
              </router-link>
            </template>
          </td>
          <td v-if="isAdmin">
            <Tooltip content="Click to change status" placement="right">
              <Button type="text" @click="change(item)">
                {{ problemVisible[item.status] }}
              </Button>
            </Tooltip>
          </td>
          <td v-if="isAdmin && canRemove">
            <Button type="text" @click="del(item.pid)">
              Delete
            </Button>
          </td>
        </tr>
      </template>
    </table>
  </div>
</template>

<style lang="stylus" scoped>
@import '../styles/common'

table
  th:nth-child(1)
    width: 5%
  th:nth-child(2)
    width: 10%
  th:nth-child(3)
    width: 20%
  th:nth-child(4)
    width: 20%
  th:nth-child(5)
    width: 20%
  th:nth-child(6)
    width: 10%
  th:nth-child(7)
    width: 10%
</style>
