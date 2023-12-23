<script setup>
import { storeToRefs } from 'pinia'
import { inject, onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Submit from '@/components/Submit'
import { useSessionStore } from '@/store/modules/session'
import { useProblemStore } from '@/store/modules/problem'
import { useRootStore } from '@/store'
import { useSolutionStore } from '@/store/modules/solution'

let title = $ref('')

const { t } = useI18n()
const problemStore = useProblemStore()
const sessionStore = useSessionStore()
const solutionStore = useSolutionStore()
const rootStore = useRootStore()

const { problem } = $(storeToRefs(problemStore))
const { isLogined } = $(storeToRefs(sessionStore))
const { solution } = $(storeToRefs(solutionStore))
const { changeDomTitle } = rootStore
const { findOne } = problemStore
const { clearCode, create } = solutionStore

const route = useRoute()
const router = useRouter()
const $Message = inject('$Message')

async function submitSolution () {
  await create(Object.assign({}, solution, { pid: problem.pid }))
  $Message.info(`submit pid:${problem.pid} success!`)
  router.push({ name: 'mySubmission', params: { pid: route.params.pid } })
}

onBeforeMount(async () => {
  if (problem.title == null) await findOne({ pid: route.params.pid })
  title = problem.title
  changeDomTitle({ title })
})
</script>

<template>
  <div>
    <h1>{{ route.params.pid }}:  {{ title }}</h1>
    <Submit />
    <Button type="primary" :disabled="!isLogined" @click="submitSolution">
      {{ t('oj.submit') }}
    </Button>
    <Button style="margin-left: 8px" @click="clearCode">
      {{ t('oj.reset') }}
    </Button>
    <p v-if="!isLogined">
      {{ t('oj.please_login') }}
    </p>
  </div>
</template>

<style lang="stylus" scoped>
h1
  color: #9799ca
  margin-top: 10px
  margin-bottom: 20px
  text-align:center
</style>
