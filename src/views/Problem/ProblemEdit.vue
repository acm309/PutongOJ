<script setup>
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { inject } from 'vue'
import OjProblemEdit from '@/components/ProblemEdit'
import { useProblemStore } from '@/store/modules/problem'

const problemStore = useProblemStore()
const route = useRoute()
const router = useRouter()
const $Message = inject('$Message')

const { problem } = $(storeToRefs(problemStore))
const { findOne, update } = problemStore

async function submit () {
  const data = await update(problem)
  $Message.success('提交成功！')
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
