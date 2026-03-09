<script setup lang="ts">
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Submit from '@/components/Submit.vue'
import { useContestStore } from '@/store/modules/contest'

const contestStore = useContestStore()
const route = useRoute()
const router = useRouter()

const { contestId, problems, problemLabels, problemTitles } = storeToRefs(contestStore)

const problemId = computed(() => Number(route.params.problemId))

function handleSubmitted () {
  router.push({ name: 'ContestMySubmissions', params: route.params })
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
    <h1 class="font-bold pt-4 text-4xl text-center" style="margin: 10px 0 20px;">
      {{ problemTitles.get(problemId) }}
    </h1>
    <Submit :problem="problemId" :contest="contestId" @submitted="handleSubmitted" />
  </div>
</template>
