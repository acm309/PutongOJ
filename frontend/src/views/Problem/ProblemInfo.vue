<script setup>
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Problem from '@/components/Problem.vue'
import { useProblemStore } from '@/store/modules/problem'

const { t } = useI18n()
const router = useRouter()
const problemStore = useProblemStore()
const { problem } = $(storeToRefs(problemStore))

function submit () {
  return router.push({
    name: 'problemSubmit',
    params: router.params,
  })
}
</script>

<template>
  <div>
    <Problem v-model="problem" />
    <Button shape="circle" icon="md-paper-plane" @click="submit">
      {{ t('oj.submit') }}
    </Button>
  </div>
</template>
