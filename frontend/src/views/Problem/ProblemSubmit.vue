<script setup>
import { storeToRefs } from 'pinia'
import { inject, onBeforeMount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import Submit from '@/components/Submit'
import { useRootStore } from '@/store'
import { useProblemStore } from '@/store/modules/problem'
import { useSessionStore } from '@/store/modules/session'
import { useSolutionStore } from '@/store/modules/solution'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = inject('$Message')

const rootStore = useRootStore()
const problemStore = useProblemStore()
const sessionStore = useSessionStore()
const solutionStore = useSolutionStore()

const { changeDomTitle } = rootStore
const { findOne } = problemStore
const { clearCode, create } = solutionStore
const { problem } = $(storeToRefs(problemStore))
const { isLogined } = $(storeToRefs(sessionStore))
const { solution } = $(storeToRefs(solutionStore))

let title = $ref('')
let loading = $ref(false)

const pid = $computed(() => route.params.pid)

async function submitSolution () {
  await create(Object.assign({}, solution, { pid }))
  message.info(`submit pid:${problem.pid} success!`)
  router.push({ name: 'MySubmissions', query: { problem: pid } })
}

async function init () {
  loading = true
  if (problem.title == null)
    await findOne({ pid })
  title = problem.title
  changeDomTitle({ title })
  loading = false
}

onBeforeMount(init)
</script>

<template>
  <div>
    <h1 class="font-bold">
      {{ pid }}: {{ title }}
    </h1>
    <Submit :pid="pid" />
    <Button type="primary" :disabled="!isLogined" @click="submitSolution">
      {{ isLogined ? t('oj.submit') : t('oj.please_login') }}
    </Button>
    <Button style="margin-left: 8px" @click="clearCode">
      {{ t('oj.reset') }}
    </Button>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
  </div>
</template>

<style lang="stylus" scoped>
h1
  margin-top: 10px
  margin-bottom: 20px
  text-align:center
</style>
