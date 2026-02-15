<script setup>
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import { onBeforeMount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Submit from '@/components/Submit'
import { useRootStore } from '@/store'
import { useProblemStore } from '@/store/modules/problem'
import { useSessionStore } from '@/store/modules/session'
import { useSolutionStore } from '@/store/modules/solution'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const message = useMessage()
const route = useRoute()
const router = useRouter()

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
const pid = $computed(() => route.params.pid)

async function submitSolution () {
  await create(Object.assign({}, solution, { pid }))
  message.info(`submit pid:${problem.pid} success!`)
  router.push({ name: 'MySubmissions', query: { problem: pid } })
}

async function init () {
  if (problem.title == null)
    await findOne({ pid })
  title = problem.title
  changeDomTitle({ title })
}

onBeforeMount(init)
</script>

<template>
  <div>
    <h1 class="font-bold text-4xl">
      {{ pid }}: {{ title }}
    </h1>
    <Submit :pid="pid" />
    <Button :disabled="!isLogined" :label="isLogined ? t('oj.submit') : t('oj.please_login')" @click="submitSolution" />
    <Button style="margin-left: 8px" :label="t('oj.reset')" severity="secondary" outlined @click="clearCode" />
  </div>
</template>

<style lang="stylus" scoped>
h1
  margin-top: 10px
  margin-bottom: 20px
  text-align:center
</style>
