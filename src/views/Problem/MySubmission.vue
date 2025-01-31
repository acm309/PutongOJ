<script setup>
import { storeToRefs } from 'pinia'
import only from 'only'
import { useRoute, useRouter } from 'vue-router'
import constant from '@/util/constant'
import { onProfileUpdate, onRouteQueryUpdate, purify } from '@/util/helper'
import { useRootStore } from '@/store'
import { useSessionStore } from '@/store/modules/session'
import { useSolutionStore } from '@/store/modules/solution'
import { timePretty } from '@/util/formate'

const solutionStore = useSolutionStore()
const sessionStore = useSessionStore()
const rootStore = useRootStore()
const route = useRoute()
const router = useRouter()

const page = $computed(() => Number.parseInt(route.query.page) || 1)
const pageSize = $computed(() => Number.parseInt(route.query.pageSize) || 20)
const { result, language: lang, color } = constant

const { list, sum } = $(storeToRefs(solutionStore))
const { profile } = $(storeToRefs(sessionStore))
const { find } = solutionStore
const { changeDomTitle } = rootStore
const query = $computed(() => {
  const opt = Object.assign(
    {},
    only(route.query, 'page pageSize language judge'),
    {
      pid: route.params.pid,
      uid: 'err',
    },
  )
  // Test optional chaining
  if (profile?.uid)
    opt.uid = profile.uid

  return purify(opt)
})

const fetch = () => find(query)
function reload (payload = {}) {
  return router.push({
    name: 'mySubmission',
    query: purify(Object.assign({}, query, payload)),
  })
}
const pageChange = val => reload({ page: val })

fetch()
changeDomTitle({ title: `Problem ${route.params.pid} - My Submission` })
onProfileUpdate(fetch)
onRouteQueryUpdate(fetch)
</script>

<template>
  <div class="status-wrap">
    <Row class="pagination">
      <Col :span="16">
        <Page :model-value="page" :total="sum" :page-size="pageSize" show-elevator @on-change="pageChange" />
      </Col>
    </Row>
    <table>
      <tr>
        <th>ID</th>
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
        </td>
        <td>{{ item.time }}</td>
        <td>{{ item.memory }}</td>
        <td>
          <router-link :to="{ name: 'solution', params: { sid: item.sid } }">
            {{ lang[item.language] }}
          </router-link>
        </td>
        <td>{{ timePretty(item.create) }}</td>
      </tr>
    </table>
  </div>
</template>

<style lang="stylus" scoped>
@import '../../styles/common'
.pagination
  margin-top: 10px
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
