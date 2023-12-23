<script setup>
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import OJProblemEdit from '@/components/ProblemEdit'
import { useProblemStore } from '@/store/modules/problem'

const { t } = useI18n()

const router = useRouter()
const problemStore = useProblemStore()
const { create } = problemStore
const problem = $ref({
  title: '',
  memory: 32268,
  time: 1000,
  description: '',
  input: '',
  output: '',
  hint: '',
  in: '',
  out: '',
})

const Message = inject('$Message')

async function submit () {
  if (!problem.title.trim()) {
    Message.error(t('oj.title_is_required'))
  } else if (!problem.description.trim()) {
    Message.error(t('oj.description_is_required'))
  } else {
    const pid = await create(problem)
    Message.success(t('oj.create_problem_success', { pid }))
    router.push({ name: 'problemInfo', params: { pid } })
  }
}
</script>

<template>
  <div>
    <h1>{{ t('oj.steps_of_create_a_problem') }}</h1>
    <br>
    <Steps :current="5" :style="{ color: 'black' }">
      <Step :title="t('oj.algorithm_design')" :content="t('oj.algorithm_design_explanation')" status="process" />
      <Step :title="t('oj.add_context')" :content="t('oj.add_context_explanation')" status="process" />
      <Step :title="t('oj.input_format')" :content="t('oj.input_format_explanation')" status="process" />
      <Step :title="t('oj.create_test_data')" :content="t('oj.create_test_data_explanation')" status="process" />
      <Step :title="t('oj.test_problem')" :content="t('oj.test_problem_explanation')" icon="ios-star" status="process" />
    </Steps>
    <br>
    <OJProblemEdit :problem="problem" />
    <Button type="primary" size="large" @click="submit">
      {{ t('oj.submit') }}
    </Button>
  </div>
</template>

<style>
</style>
