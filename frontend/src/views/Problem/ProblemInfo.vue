<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Problem from '@/components/Problem.vue'
import { useProblemStore } from '@/store/modules/problem'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const problemStore = useProblemStore()
const { problem } = storeToRefs(problemStore)

function submit () {
  return router.push({
    name: 'problemSubmit',
    params: route.params,
  })
}
</script>

<template>
  <div>
    <Problem v-model="problem" />
    <Button rounded icon="pi pi-send" :label="t('oj.submit')" @click="submit" />
  </div>
</template>
