<script setup>
import { inject, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import OJProblemEdit from '@/components/ProblemEdit'
import { useProblemStore } from '@/store/modules/problem'
import { useTestcaseStore } from '@/store/modules/testcase'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const problemStore = useProblemStore()
const testcaseStore = useTestcaseStore()
const problem = $ref({
  title: '',
  memory: 32768,
  time: 1000,
  description: '',
  input: '',
  output: '',
  hint: '',
  in: '',
  out: '',
  type: 1,
  code: '',
  course: null,
})

const $Message = inject('$Message')
const $Modal = inject('$Modal')

async function submit () {
  const pid = await problemStore.create(problem)
  $Message.success(t('oj.create_problem_success', { pid }))
  if (!problem.in && !problem.out) {
    $Message.info(t('oj.sample_input_output_empty'))
  } else {
    const test = {
      pid,
      in: problem.in,
      out: problem.out,
    }
    await testcaseStore.create(test)
    $Message.success(t('oj.sample_testcase_created'))
  }
  router.push({ name: 'problemInfo', params: { pid } })
}

async function submitCheck () {
  if (!problem.title.trim()) {
    $Message.error(t('oj.title_is_required'))
  } else if (!problem.description.trim()) {
    $Message.error(t('oj.description_is_required'))
  } else {
    if (!problem.in || !problem.out) {
      $Modal.confirm({
        title: t('oj.notice'),
        content: t('oj.sample_input_output_incomplete'),
        onOk: async () => {
          await submit()
        },
        onCancel: () => {
          $Message.info(t('oj.creation_cancelled'))
        },
      })
    } else {
      await submit()
    }
  }
}

onMounted(() => {
  if (route.query.course) {
    problem.course = Number.parseInt(route.query.course)
  }
})
</script>

<template>
  <div class="new-problem-wrap">
    <h2>{{ t('oj.steps_of_create_a_problem') }}</h2>
    <br>
    <Steps direction="vertical" :style="{ color: 'black' }">
      <Step :title="t('oj.algorithm_design')" :content="t('oj.algorithm_design_explanation')" status="process" />
      <Step :title="t('oj.add_context')" :content="t('oj.add_context_explanation')" status="process" />
      <Step :title="t('oj.input_format')" :content="t('oj.input_format_explanation')" status="process" />
      <Step :title="t('oj.create_test_data')" :content="t('oj.create_test_data_explanation')" status="process" />
      <Step :title="t('oj.test_problem')" :content="t('oj.test_problem_explanation')" status="process" />
    </Steps>
    <br>
    <OJProblemEdit :problem="problem" />
    <Button type="primary" size="large" @click="submitCheck">
      {{ t('oj.submit') }}
    </Button>
  </div>
</template>

<style lang="stylus" scoped>
@import '../../styles/common'

.new-problem-wrap
  max-width 1024px
</style>
