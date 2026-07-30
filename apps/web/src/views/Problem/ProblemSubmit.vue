<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onBeforeMount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Submit from '@/components/Submit.vue'
import { useRootStore } from '@/store'
import { useProblemStore } from '@/store/modules/problem'

const route = useRoute()
const router = useRouter()

const rootStore = useRootStore()
const problemStore = useProblemStore()

const { changeDomTitle } = rootStore
const { findOne } = problemStore
const { problem } = storeToRefs(problemStore)

const title = ref('')
const problemId = computed(() => Number(route.params.problemId))

function handleSubmitted () {
  router.push({ name: 'MySubmissions', query: { problemId: problemId.value } })
}

async function init () {
  if (problem.value?.id !== problemId.value)
    await findOne(problemId.value)
  title.value = problem.value?.title ?? ''
  changeDomTitle({ title: title.value })
}

onBeforeMount(init)
</script>

<template>
  <div>
    <h1 class="font-bold text-4xl">
      {{ problemId }}: {{ title }}
    </h1>
    <Submit :problem="problemId" @submitted="handleSubmitted" />
  </div>
</template>

<style lang="stylus" scoped>
h1
  margin-top: 10px
  margin-bottom: 20px
  text-align:center
</style>
