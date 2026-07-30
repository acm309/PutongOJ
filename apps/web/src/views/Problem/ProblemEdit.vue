<script setup lang="ts">
import type { ProblemUpdatePayload } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import OjProblemEdit from '@/components/ProblemEdit.vue'
import { useProblemStore } from '@/store/modules/problem'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const message = useMessage()
const route = useRoute()
const router = useRouter()
const problemStore = useProblemStore()

const { problem } = storeToRefs(problemStore)
const { findOne, update: updateProblem } = problemStore
const problemId = computed(() => Number.parseInt(route.params.problemId as string))

const loadingProblem = ref(false)
const problemForm = ref<ProblemUpdatePayload>({})

async function loadProblem () {
  loadingProblem.value = true
  await findOne(problemId.value)
  loadingProblem.value = false
}

async function submitForm () {
  const response = await updateProblem(problemId.value, problemForm.value)
  if (!response.success || !response.data.success || response.data.id === null) return
  message.success(t('oj.submit_success'))
  await loadProblem()
  router.push({ name: 'problemInfo', params: { problemId: response.data.id } })
}

onMounted(async () => {
  if (problem.value?.id !== problemId.value) {
    await loadProblem()
  }
  problemForm.value = {
    ...problem.value,
    tagIds: problem.value?.tags.map(tag => tag.id) ?? [],
  }
})
</script>

<template>
  <div>
    <OjProblemEdit :problem="problemForm" />
    <Button label="Submit" @click="submitForm" />
  </div>
</template>

<style lang="stylus" scoped>
.divider
  margin 40px 0
.course-select
  max-width: 384px
</style>
