<script setup>
import 'highlight.js/styles/github.css'
// import highlight from 'highlight.js'
// https://github.com/isagalaev/highlight.js/issues/1284
import highlight from 'highlight.js/lib/core'
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import 'highlight.js/styles/atom-one-light.css'
import { storeToRefs } from 'pinia'
import { inject, onBeforeMount } from 'vue'
import { useRoute } from 'vue-router'
import { useClipboard } from '@vueuse/core'
import constant from '@/util/constant'
import { useSessionStore } from '@/store/modules/session'
import { testcaseUrl } from '@/util/helper'
import { useRootStore } from '@/store'
import { useSolutionStore } from '@/store/modules/solution'

highlight.registerLanguage('cpp', cpp)
highlight.registerLanguage('java', java)

const result = $ref(constant.result)
const language = $ref(constant.language)
const color = $ref(constant.color)

const session = useSessionStore()
const solutionStore = useSolutionStore()
const root = useRootStore()

const { findOne } = solutionStore
const { solution } = $(storeToRefs(solutionStore))
const { isAdmin } = storeToRefs(session)

const route = useRoute()

const $Message = inject('$Message')
const { copy } = useClipboard()
const onCopy = (content) => {
  copy(content)
  $Message.success('Copied!')
}

function prettyCode (code) {
  return highlight.highlight(language[solution.language], `${code}`).value
}

function testcaseUrl2 ({ uuid }, type) {
  return testcaseUrl(solution.pid, uuid, type)
}

onBeforeMount(async () => {
  await findOne(route.params)
  root.changeDomTitle({ title: `Solution ${solution.pid}` })
})
</script>

<template>
  <div v-if="solution">
    <h1>{{ result[solution.judge] }}</h1>
    <p>
      <span>Problem:
        <router-link :to="{ name: 'problemInfo', params: { pid: solution.pid } }">
          {{ solution.pid }}
        </router-link>
      </span>
      <span>Memory: {{ solution.memory }} KB</span>
      <span>Runtime: {{ solution.time }} MS</span>
      <span>Author:
        <router-link :to="{ name: 'userInfo', params: { uid: solution.uid } }">
          {{ solution.uid }}
        </router-link>
      </span>
    </p>
    <hr>
    <h2>Testcases</h2>
    <table>
      <tr>
        <th>Uuid</th>
        <th>Time/ms</th>
        <th>Memory/kb</th>
        <th>Result</th>
      </tr>
      <template v-for="(item, index) in solution.testcases" :key="index">
        <tr>
          <td>
            {{ item.uuid.slice(0, 8) }}
            <a :href="testcaseUrl2(item, 'in')" target="_blank">TestIn</a>
            <a :href="testcaseUrl2(item, 'out')" target="_blank">TestOut</a>
          </td>
          <td>{{ item.time }}</td>
          <td>{{ item.memory }}</td>
          <td :class="color[item.judge]">
            {{ result[item.judge] }}
          </td>
        </tr>
      </template>
    </table>
    <!-- <hr> -->
    <pre v-if="solution.error" class="error"><code>{{ solution.error }}</code></pre>
    <br>
    <Button shape="circle" icon="ios-document-outline" @click="onCopy(solution.code)">
      Click to copy code
    </Button>
    <pre><code v-html="prettyCode(solution.code)" /></pre>
    <div v-if="isAdmin && solution.sim && solution.simSolution">
      <hr>
      Similarity: {{ solution.sim }}{{ "%" }} <br>
      From: {{ solution.simSolution.sid }} by
      <router-link :to="{ name: 'userInfo', params: { uid: solution.simSolution.uid } }">
        {{ solution.simSolution.uid }}
      </router-link>
      <pre><code v-html="prettyCode(solution.simSolution.code)" /></pre>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
@import '../styles/common'

h1
  margin-bottom: 6px
p
  margin-bottom: 4px
span
  margin-right: 20px
hr
  margin-bottom: 10px
pre
  border: 1px solid #e040fb
  border-radius: 4px
  padding: 10px
  &.error
    background-color: #FFF9C4
</style>
