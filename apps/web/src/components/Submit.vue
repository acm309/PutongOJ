<script setup lang="ts">
import type { SolutionSubmitPayload } from '@putongoj/shared'
import type { PropType } from 'vue'
import { Language } from '@putongoj/shared'
import debounce from 'lodash.debounce'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { createSolution } from '@/api/solution'
import { useSessionStore } from '@/store/modules/session'
import { languageLabels, languagesOrder } from '@/utils/constant'
import { useSolutionStorage } from '@/utils/helper'
import { useMessage } from '@/utils/message'

const props = defineProps({
  problem: {
    type: Number,
    required: true,
  },
  contest: {
    type: Number,
    default: undefined,
  },
  allowedLanguages: {
    type: Array as PropType<Language[] | null>,
    default: null,
  },
})

const emit = defineEmits<{
  submitted: [payload: { submissionId: number, problemId: number, contestId?: number }]
}>()

const { t } = useI18n()
const message = useMessage()
const sessionStore = useSessionStore()
const { isLogined } = storeToRefs(sessionStore)
const solutionStorage = useSolutionStorage()
const isSubmitting = ref(false)
const solution = reactive<{
  language: Language | null
  sourceCode: string
}>({
  language: null,
  sourceCode: '',
})

const storageKey = computed(() => props.contest == null ? `problem:${props.problem}` : `contest:${props.contest}:problem:${props.problem}`)

const languages = computed(() =>
  languagesOrder
    .filter(key => props.allowedLanguages == null || props.allowedLanguages.includes(key))
    .map(key => ({
      value: key,
      label: languageLabels[key],
    })),
)

const defaultLanguage = computed<Language | null>(() => languages.value[0]?.value ?? null)

function isLanguageAllowed (language: Language | null) {
  return language != null && (props.allowedLanguages == null || props.allowedLanguages.includes(language))
}

function resetSolution (nextSolution?: Partial<typeof solution>) {
  solution.language = isLanguageAllowed(nextSolution?.language ?? null)
    ? nextSolution!.language!
    : defaultLanguage.value
  solution.sourceCode = nextSolution?.sourceCode ?? ''
}

function init () {
  if (storageKey.value && solutionStorage.value[storageKey.value]) {
    resetSolution(solutionStorage.value[storageKey.value])
    return
  }

  resetSolution()
}

function reset () {
  solution.sourceCode = ''
}

function validateBeforeSubmit () {
  if (!isLogined.value) {
    message.warn(t('ptoj.please_login_first'))
    return false
  }

  if (solution.language == null) {
    message.warn(t('ptoj.select_language_first'))
    return false
  }

  if (!solution.sourceCode.trim()) {
    message.warn(t('ptoj.code_cannot_be_empty'))
    return false
  }

  if (solution.language === Language.JAVA && !solution.sourceCode.includes('Main')) {
    message.warn(t('ptoj.java_main_class_required'))
    return false
  }

  return true
}

async function submit () {
  if (isSubmitting.value || !validateBeforeSubmit()) {
    return
  }

  const language = solution.language
  if (language == null) {
    return
  }

  isSubmitting.value = true

  try {
    const payload: SolutionSubmitPayload = {
      problemId: props.problem,
      language,
      sourceCode: solution.sourceCode,
    }

    if (props.contest != null) {
      payload.contestId = props.contest
    }

    const resp = await createSolution(payload)
    if (!resp.success || !resp.data) {
      message.error(t('ptoj.failed_proceed'), resp.message)
      return
    }

    message.success(t('oj.submit_success'))
    emit('submitted', {
      submissionId: resp.data.submissionId,
      problemId: payload.problemId,
      contestId: payload.contestId,
    })
  } finally {
    isSubmitting.value = false
  }
}

const persistSolution = debounce((updatedSolution: typeof solution) => {
  if (!storageKey.value) {
    return
  }

  solutionStorage.value[storageKey.value] = {
    language: updatedSolution.language,
    sourceCode: updatedSolution.sourceCode,
  }
}, 500)

watch(
  solution,
  updatedSolution => persistSolution(updatedSolution),
  { deep: true },
)
watch(
  () => props.allowedLanguages,
  () => {
    if (solution.language != null && !isLanguageAllowed(solution.language)) {
      solution.language = defaultLanguage.value
    }
  },
  { deep: true },
)
watch(() => [ props.problem, props.contest ], init, { immediate: true })

onBeforeUnmount(() => {
  persistSolution.flush()
  persistSolution.cancel()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <label class="block font-medium mb-1 text-base">{{ t('ptoj.language') }}</label>
      <Select
        v-model="solution.language" :options="languages" option-label="label" option-value="value"
        class="w-full"
      />
    </div>
    <div>
      <Message
        v-if="solution.language === Language.JAVA" :severity="solution.sourceCode.includes('Main') ? 'info' : 'warn'"
        :closable="false" icon="pi pi-info-circle"
      >
        {{ t('ptoj.java_main_class_required') }}
      </Message>
      <Textarea
        v-model="solution.sourceCode" class="font-mono" fluid auto-resize rows="15"
        :placeholder="t('oj.paste_your_code')"
      />
    </div>
    <div class="flex gap-4">
      <Button
        :disabled="!isLogined || isSubmitting" :label="isLogined ? t('oj.submit') : t('oj.please_login')"
        icon="pi pi-send" :loading="isSubmitting" @click="submit"
      />
      <Button :disabled="isSubmitting" :label="t('oj.reset')" icon="pi pi-trash" severity="secondary" outlined @click="reset" />
    </div>
  </div>
</template>
