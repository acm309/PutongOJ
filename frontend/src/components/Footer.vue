<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Dialog from 'primevue/dialog'
import SelectButton from 'primevue/selectbutton'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRootStore } from '@/store'
import { timeDiffPretty, timePretty } from '@/utils/format'
import { useHumanLanguage } from '@/utils/helper'

const { locale } = useI18n()
const rootStore = useRootStore()
const selectedLang = useHumanLanguage()
const {
  website: backend,
  currentTime,
  timeDiff,
} = storeToRefs(rootStore)

const versionDialogVisible = ref(false)
const serverTime = computed(() => {
  if (Number.isNaN(timeDiff.value)) {
    return 'Syncing...'
  }
  return `${timePretty(currentTime.value)} (${timeDiffPretty(timeDiff.value)})`
})

const frontend = {
  buildSHA: import.meta.env.VITE_BUILD_SHA || 'unknown',
  buildTime: Number.parseInt(import.meta.env.VITE_BUILD_TIME) || Date.now(),
} as const

const langs = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
]

function onLangSelected (event: any) {
  locale.value = selectedLang.value = event.value
}

onMounted(() => {
  locale.value = selectedLang.value
})
</script>

<template>
  <div class="flex flex-col gap-1.5 items-center p-8">
    <SelectButton
      v-model="selectedLang" class="block mb-4" :options="langs" option-label="label" option-value="value"
      :allow-empty="false" @change="onLangSelected"
    />

    <span class="-mb-0.5 cursor-pointer font-bold text-lg" @click="versionDialogVisible = true">
      Putong OJ
    </span>
    <span>
      &copy; 2017-2026
      <a href="https://github.com/acm309" target="_blank" rel="noopener noreferrer">ACM&hairsp;@&hairsp;CJLU</a>
    </span>
    <span>Server time: {{ serverTime }}</span>
  </div>

  <Dialog v-model:visible="versionDialogVisible" modal header="Putong OJ" class="mx-6">
    <div class="font-mono space-y-4">
      <div>
        <div class="flex justify-between">
          <span class="font-bold">Backend</span>
          <span>#{{ backend.buildSHA }}</span>
        </div>
        <div>Built at {{ timePretty(backend.buildTime, 'yyyy-MM-dd\'T\'HH:mm:ssXXX') }}</div>
      </div>
      <div>
        <div class="flex justify-between">
          <span class="font-bold">Frontend</span>
          <span>#{{ frontend.buildSHA }}</span>
        </div>
        <div>Built at {{ timePretty(frontend.buildTime, 'yyyy-MM-dd\'T\'HH:mm:ssXXX') }}</div>
      </div>
    </div>
  </Dialog>
</template>
