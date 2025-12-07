<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Dialog from 'primevue/dialog'
import SelectButton from 'primevue/selectbutton'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AuthnDialog from '@/components/AuthnDialog.vue'
import Header from '@/components/Header.vue'
import { useRootStore } from '@/store'
import { timeDiffPretty, timePretty } from '@/utils/formate'
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
  <div class="bg-emphasis flex flex-col font-sans min-h-screen relative text-color">
    <Header />
    <div class="flex-auto lg:pt-4 lg:px-4 md:pt-2 md:px-2 min-h-[512px] mt-[61px]">
      <RouterView
        class="bg-(--p-content-background) border border-surface layout-content md:rounded-xl mx-auto shadow-lg"
      />
    </div>
    <div class="p-8 text-base/relaxed text-center">
      <SelectButton
        v-model="selectedLang" class="block" :options="langs" option-label="label" option-value="value"
        :allow-empty="false" @change="onLangSelected"
      />
      <div class="mb-4">
        Server time: {{ serverTime }}
      </div>
      <div class="cursor-pointer" @click="versionDialogVisible = true">
        <div class="font-bold mb-px text-lg">
          Putong OJ
        </div>
        <div>Copyright &copy; 2017-2025 CJLU ACM Lab.</div>
      </div>
    </div>
  </div>
  <Dialog v-model:visible="versionDialogVisible" modal header="Info" class="mx-6">
    <div class="font-mono space-y-4">
      <div>
        <div class="flex justify-between">
          <span class="font-bold">Backend</span>
          <span>#{{ backend.buildSHA }}</span>
        </div>
        <div>Built at {{ timePretty(backend.buildTime) }}</div>
      </div>
      <div>
        <div class="flex justify-between">
          <span class="font-bold">Frontend</span>
          <span>#{{ frontend.buildSHA }}</span>
        </div>
        <div>Built at {{ timePretty(frontend.buildTime) }}</div>
      </div>
    </div>
  </Dialog>
  <AuthnDialog />
</template>

<style lang="stylus">
.layout-content
  position relative
  padding 40px
  max-width 1280px

.wrap-loading
  z-index 40
.wrap-loading, .modal-loading
  border-radius 7px

@media screen and (max-width 1024px)
  .layout-content
    padding 10px 20px 20px

@media screen and (max-width 768px)
  .wrap-loading
    border-radius 0
</style>
