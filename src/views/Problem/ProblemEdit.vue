<script setup>
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import OjProblemEdit from '@/components/ProblemEdit'
import { useProblemStore } from '@/store/modules/problem'

const { t } = useI18n()
const problemStore = useProblemStore()
const route = useRoute()
const router = useRouter()
const $Message = inject('$Message')

const { problem } = $(storeToRefs(problemStore))
const { findOne, update } = problemStore

async function submit () {
  const data = await update(problem)
  $Message.success(t('oj.submit_success'))
  router.push({ name: 'problemInfo', params: { pid: data.pid } })
}

findOne({ pid: route.params.pid })
</script>

<template>
  <div>
    <OjProblemEdit :problem="problem" />
    <Button type="primary" @click="submit">
      Submit
    </Button>
  </div>
</template>
