<script setup lang="ts">
import type { Message } from 'view-ui-plus'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Submit from '@/components/Submit.vue'
import { useContestStore } from '@/store/modules/contest'
import { useSolutionStore } from '@/store/modules/solution'
import { contestLabeling } from '@/utils/formate'

const { t } = useI18n()
const contestStore = useContestStore()
const solutionStore = useSolutionStore()
const route = useRoute()
const router = useRouter()
const message = inject('$Message') as typeof Message

const { problems, overview, contest, totalProblems } = $(storeToRefs(contestStore))
const { solution } = $(storeToRefs(solutionStore))
const { clearCode: reset, create } = solutionStore

const currentProblemId = $computed(() => Number(route.params.id))
const currentContestId = $computed(() => route.params.cid)
const currentTitle = $computed(() => overview[currentProblemId - 1]?.title)

const pid = $computed(() => problems[currentProblemId - 1])
const mid = $computed(() => currentContestId)

async function submit () {
  await create({ pid, mid, ...solution })
  router.push({ name: 'ContestMySubmissions', params: route.params })
  message.info(t('oj.submitSuccess', { id: currentProblemId }))
}
</script>

<template>
  <div class="p-6">
    <div class="flex flex-wrap gap-2">
      <RouterLink
        v-for="i in totalProblems" :key="i"
        :to="{ name: 'contestSubmit', params: { cid: contest.cid, id: i } }"
      >
        <Button
          class="min-w-10" :severity="i === currentProblemId ? 'primary' : 'secondary'"
          :outlined="i !== currentProblemId" :disabled="overview[i - 1].invalid"
        >
          {{ contestLabeling(i, contest.option?.labelingStyle) }}
        </Button>
      </RouterLink>
    </div>
    <h1 class="font-bold mb-[20px] mt-[10px] pt-4 text-center">
      {{ contestLabeling(currentProblemId, contest.option?.labelingStyle) }}:
      {{ currentTitle }}
    </h1>
    <Submit :pid="String(pid)" />
    <div class="flex gap-4">
      <Button :label="t('oj.submit')" icon="pi pi-send" @click="submit" />
      <Button :label="t('oj.reset')" icon="pi pi-trash" severity="secondary" outlined @click="reset" />
    </div>
  </div>
</template>
