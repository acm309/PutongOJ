<script setup>
import { storeToRefs } from 'pinia'
import { onBeforeMount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import Problem from '@/components/Problem.vue'
import { useRootStore } from '@/store'
import { useProblemStore } from '@/store/modules/problem'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const rootStore = useRootStore()
const problemStore = useProblemStore()

const { changeDomTitle } = rootStore
const { findOne } = problemStore
const { problem } = $(storeToRefs(problemStore))

let loading = $ref(false)

function submit() {
  return router.push({
    name: 'problemSubmit',
    params: router.params,
  })
}

async function init() {
  loading = true
  await findOne(route.params)
  changeDomTitle({ title: problem.title })
  loading = false
}

onBeforeMount(init)
</script>

<template>
  <div>
    <Problem v-model="problem" />
    <Button shape="circle" icon="md-paper-plane" @click="submit">
      {{ t('oj.submit') }}
    </Button>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
  </div>
</template>
