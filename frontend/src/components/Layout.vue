<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import SelectButton from 'primevue/selectbutton'
import { Poptip, Space } from 'view-ui-plus'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Header from '@/components/Header.vue'
import LoginAndRegister from '@/components/LoginAndRegister.vue'
import { useRootStore } from '@/store'
import { timeDiffPretty, timePretty } from '@/utils/formate'
import { useHumanLanguage } from '@/utils/helper'

const { locale } = useI18n()
const rootStore = useRootStore()

const { website: backend, currentTime, timeDiff } = storeToRefs(rootStore)

const serverTime = computed(() =>
  Number.isNaN(timeDiff.value)
    ? 'Syncing...'
    : `${timePretty(currentTime.value)} (${timeDiffPretty(timeDiff.value)})`)
const frontend = {
  buildSHA: import.meta.env.VITE_BUILD_SHA || 'unknown',
  buildTime: Number.parseInt(import.meta.env.VITE_BUILD_TIME) || Date.now(),
}

let selectedLang = useHumanLanguage()
locale.value = selectedLang.value

const langs = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
]

function onLangSelected (event: any) {
  locale.value = selectedLang = event.value
}
</script>

<template>
  <div class="bg-emphasis flex flex-col font-sans min-h-screen relative text-color">
    <Header />
    <div class="flex-auto lg:pt-4 lg:px-4 md:pt-2 md:px-2 min-h-[512px] mt-[61px]">
      <router-view
        class="bg-(--p-content-background) border border-surface layout-content md:rounded-xl mx-auto shadow-lg"
      />
    </div>
    <div class="50px] p-8 padding-[24px text-base/relaxed text-center">
      <SelectButton
        v-model="selectedLang" class="block" :options="langs" option-label="label" option-value="value"
        @change="onLangSelected"
      />
      <div class="mb-4">
        Server time: {{ serverTime }}
      </div>
      <Poptip trigger="hover">
        <div class="font-bold mb-px text-lg">
          Putong OJ
        </div>
        <div>Copyright &copy; 2017-2025 CJLU ACM Lab.</div>
        <template #content>
          <Space direction="vertical">
            <div>
              <div class="flex justify-between w-full">
                <code><b>Putong OJ Backend</b></code>
                <code>#{{ backend.buildSHA }}</code>
              </div>
              <code>Built at {{ timePretty(backend.buildTime) }}</code>
            </div>
            <div>
              <div class="flex justify-between w-full">
                <code><b>Putong OJ Frontend</b></code>
                <code>#{{ frontend.buildSHA }}</code>
              </div>
              <code>Built at {{ timePretty(frontend.buildTime) }}</code>
            </div>
          </Space>
        </template>
      </Poptip>
    </div>
  </div>
  <LoginAndRegister />
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
