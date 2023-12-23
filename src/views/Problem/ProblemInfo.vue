<script setup>
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Problem from '@/components/Problem.vue'
import { useProblemStore } from '@/store/modules/problem'
import { useRootStore } from '@/store'

const { t } = useI18n()
const problemStore = useProblemStore()
const rootStore = useRootStore()
const route = useRoute()
const router = useRouter()

const { problem } = $(storeToRefs(problemStore))
const { findOne } = problemStore
const { changeDomTitle } = rootStore

function submit () {
  return router.push({
    name: 'problemSubmit',
    params: router.params,
  })
}

findOne(route.params).then(() => {
  changeDomTitle(problem.title)
})
</script>

<template>
  <div class="proinfo-wrap">
    <Problem :problem="problem" />
    <Button shape="circle" icon="md-paper-plane" @click="submit">
      {{ t('oj.submit') }}
    </Button>
  </div>
</template>
