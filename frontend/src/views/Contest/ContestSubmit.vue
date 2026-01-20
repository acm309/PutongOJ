<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import { Message } from 'view-ui-plus'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Submit from '@/components/Submit.vue'
import { useContestStore } from '@/store/modules/contest'
import { useSolutionStore } from '@/store/modules/solution'

const { t } = useI18n()
const contestStore = useContestStore()
const solutionStore = useSolutionStore()
const route = useRoute()
const router = useRouter()

const { contestId, problems, problemLabels, problemTitles } = storeToRefs(contestStore)
const { solution } = $(storeToRefs(solutionStore))
const { clearCode: reset, create } = solutionStore

const problemId = computed(() => Number(route.params.problemId))

async function submit () {
  await create({ pid: problemId.value, mid: contestId.value, ...solution })
  router.push({ name: 'ContestMySubmissions', params: route.params })
  Message.info(t('oj.submitSuccess', { id: problemId.value }))
}
</script>

<template>
  <div class="p-6">
    <div class="flex flex-wrap gap-2">
      <RouterLink
        v-for="p in problems" :key="p.problemId"
        :to="{ name: 'contestSubmit', params: { contestId, problemId: p.problemId } }"
      >
        <Button
          class="min-w-10" :severity="p.problemId === problemId ? 'primary' : 'secondary'"
          :outlined="p.problemId !== problemId"
        >
          {{ problemLabels.get(p.problemId) }}
        </Button>
      </RouterLink>
    </div>
    <h1 class="font-bold  pt-4  text-center" style="margin: 10px 0 20px;">
      {{ problemTitles.get(problemId) }}
    </h1>
    <Submit :pid="String(problemId)" />
    <div class="flex gap-4">
      <Button :label="t('oj.submit')" icon="pi pi-send" @click="submit" />
      <Button :label="t('oj.reset')" icon="pi pi-trash" severity="secondary" outlined @click="reset" />
    </div>
  </div>
</template>
