<script setup>
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()

const home = () => router.push({ name: 'home' })
const back = () => router.go(-1)
</script>

<template>
  <div class="bg-transparent border-none flex flex-col items-center justify-center min-h-200 px-4 shadow-none">
    <div class="max-w-md text-center w-full">
      <div class="inline-flex items-center justify-center mb-8">
        <div class="relative">
          <span class="font-bold opacity-90 text-8xl text-gray-300">Nothing</span>
          <div class="absolute flex inset-0 items-center justify-center opacity-75">
            <i class="pi pi-exclamation-triangle text-9xl text-amber-500" />
          </div>
          <span class="font-bold opacity-90 text-8xl text-gray-300"><br>Found</span>
        </div>
      </div>

      <div class="flex flex-row gap-4 justify-center">
        <Button :label="t('ptoj.go_back')" icon="pi pi-arrow-left" severity="secondary" outlined @click="back" />
        <Button :label="t('ptoj.go_home')" icon="pi pi-home" @click="home" />
      </div>
    </div>
  </div>
</template>
