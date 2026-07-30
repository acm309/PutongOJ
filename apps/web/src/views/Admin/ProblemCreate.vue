<script setup lang="ts">
import { ProblemJudgeType, ProblemVisibility } from '@putongoj/shared'
import Button from 'primevue/button'
import { useConfirm } from 'primevue/useconfirm'
import { onMounted, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { createTestcase } from '@/api/problem'
import OJProblemEdit from '@/components/ProblemEdit.vue'
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
  memoryLimitKb: 32768,
  timeLimitMs: 1000,
  description: '',
  inputFormat: '',
  outputFormat: '',
  hint: '',
  sampleInput: '',
  sampleOutput: '',
  judgeType: ProblemJudgeType.TRADITIONAL,
  judgeCode: '',
  tagIds: [] as number[],
  visibility: ProblemVisibility.RESERVED,
  courseId: undefined as number | undefined,
})

async function submit () {
  const response = await problemStore.create(problem)
  if (!response.success) {
    message.error(t('oj.failed_proceed'), response.message)
    return
  }
  const problemId = response.data.id
  message.success(t('oj.create_problem_success', { pid: problemId }))
  if (!problem.sampleInput && !problem.sampleOutput) {
    message.info(t('oj.sample_input_output_empty'))
  } else {
    await createTestcase(problemId, { input: problem.sampleInput, output: problem.sampleOutput })
    message.success(t('oj.sample_testcase_created'))
  }
  router.push({ name: 'problemInfo', params: { problemId } })
}

async function submitCheck () {
  if (!problem.title.trim()) {
    message.error(t('oj.title_is_required'))
  } else if (!problem.description.trim()) {
    message.error(t('oj.description_is_required'))
  } else {
    if (!problem.sampleInput || !problem.sampleOutput) {
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
  if (route.query.courseId) {
    problem.courseId = Number.parseInt(route.query.courseId as string)
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
