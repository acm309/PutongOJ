<script setup>
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import Problem from '@/components/Problem.vue'
import { useProblemStore } from '@/store/modules/problem'
import { useRootStore } from '@/store'

const problemStore = useProblemStore()
const rootStore = useRootStore()
const route = useRoute()
const router = useRouter()

const { problem } = $(storeToRefs(problemStore))
const { findOne } = problemStore
const { changeDomTitle } = rootStore

const submit = () => router.push({
  name: 'problemSubmit',
  params: router.params,
})

findOne(route.params).then(() => {
  changeDomTitle(problem.title)
})
</script>

<template>
  <div class="proinfo-wrap">
    <Problem :problem="problem" />
    <Button shape="circle" icon="md-paper-plane" @click="submit">
      Submit
    </Button>
  </div>
</template>
