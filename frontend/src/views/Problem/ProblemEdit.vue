<script setup lang="ts">
import type { ProblemEntityForm } from '@backend/types/entity'
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
const paramPid = computed(() => Number.parseInt(route.params.pid as string))

const loadingProblem = ref(false)
const problemForm = ref({} as Partial<ProblemEntityForm>)

async function loadProblem () {
  loadingProblem.value = true
  await findOne({ pid: paramPid.value })
  loadingProblem.value = false
}

async function submitForm () {
  const data = await updateProblem(problemForm.value)
  message.success(t('oj.submit_success'))
  router.push({ name: 'problemInfo', params: { pid: data.pid } })
}

onMounted(async () => {
  if (problem.value?.pid !== paramPid.value) {
    await loadProblem()
  }
  problemForm.value = {
    ...problem.value,
    tags: problem.value.tags?.map(tag => tag.tagId) || [],
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
