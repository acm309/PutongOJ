<script setup>
import Button from 'primevue/button'
import { useConfirm } from 'primevue/useconfirm'
import { onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { createTestcase } from '@/api/problem'
import OJProblemEdit from '@/components/ProblemEdit'
import { useProblemStore } from '@/store/modules/problem'
import { useMessage } from '@/utils/message'

const { t } = useI18n()
const message = useMessage()
const confirm = useConfirm()
const route = useRoute()
const router = useRouter()
const problemStore = useProblemStore()
const problem = reactive({
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
  tags: [],
})

async function submit () {
  const pid = await problemStore.create(problem)
  message.success(t('oj.create_problem_success', { pid }))
  if (!problem.in && !problem.out) {
    message.info(t('oj.sample_input_output_empty'))
  } else {
    await createTestcase(pid, { in: problem.in, out: problem.out })
    message.success(t('oj.sample_testcase_created'))
  }
  router.push({ name: 'problemInfo', params: { pid } })
}

async function submitCheck () {
  if (!problem.title.trim()) {
    message.error(t('oj.title_is_required'))
  } else if (!problem.description.trim()) {
    message.error(t('oj.description_is_required'))
  } else {
    if (!problem.in || !problem.out) {
      confirm.require({
        header: t('oj.notice'),
        message: t('oj.sample_input_output_incomplete'),
        acceptProps: {
          label: t('oj.ok'),
        },
        rejectProps: {
          label: t('oj.cancel'),
          severity: 'secondary',
          outlined: true,
        },
        accept: async () => {
          await submit()
        },
        reject: () => {
          message.info(t('oj.creation_cancelled'))
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
    <ol class="steps-list">
      <li class="step-item">
        <span class="step-title">{{ t('oj.algorithm_design') }}</span>
        <span class="step-desc">{{ t('oj.algorithm_design_explanation') }}</span>
      </li>
      <li class="step-item">
        <span class="step-title">{{ t('oj.add_context') }}</span>
        <span class="step-desc">{{ t('oj.add_context_explanation') }}</span>
      </li>
      <li class="step-item">
        <span class="step-title">{{ t('oj.input_format') }}</span>
        <span class="step-desc">{{ t('oj.input_format_explanation') }}</span>
      </li>
      <li class="step-item">
        <span class="step-title">{{ t('oj.create_test_data') }}</span>
        <span class="step-desc">{{ t('oj.create_test_data_explanation') }}</span>
      </li>
      <li class="step-item">
        <span class="step-title">{{ t('oj.test_problem') }}</span>
        <span class="step-desc">{{ t('oj.test_problem_explanation') }}</span>
      </li>
    </ol>
    <br>
    <OJProblemEdit :problem="problem" />
    <Button label="Submit" @click="submitCheck" />
  </div>
</template>

<style lang="stylus" scoped>
.new-problem-wrap
  max-width 1024px

.steps-list
  list-style none
  padding-left 0
  counter-reset step-counter

.step-item
  counter-increment step-counter
  display flex
  flex-direction column
  padding 12px 0
  position relative

.step-title
  font-weight 600
  font-size 15px
  margin-bottom 2px

.step-desc
  color var(--p-text-muted-color)
  font-size 13px
</style>
