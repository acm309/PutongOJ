<script setup lang="ts">
import type { ContestConfigEditPayload, ContestConfigQueryResult } from '@putongoj/shared'
import { contestLabelingStyle } from '@backend/utils/constants'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import DatePicker from 'primevue/datepicker'
import IftaLabel from 'primevue/iftalabel'
import InputSwitch from 'primevue/inputswitch'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { getConfig, updateConfig } from '@/api/contest'
import ProblemSelect from '@/components/ProblemSelect.vue'
import { useProblemStore } from '@/store/modules/problem'
import { useMessage } from '@/utils/message'

type ContestConfigForm = Required<Pick<ContestConfigEditPayload, 'title'
  | 'startsAt' | 'endsAt' | 'scoreboardFrozenAt' | 'scoreboardUnfrozenAt'
  | 'isHidden' | 'isPublic' | 'password'
  | 'labelingStyle'>>

const { t } = useI18n()
const route = useRoute()
const message = useMessage()
const problemStore = useProblemStore()

const contestId = computed(() => Number(route.params.contestId))
const contestConfig = ref<ContestConfigQueryResult | null>(null)
const courseId = computed(() => contestConfig.value?.course?.courseId)

const form = ref<ContestConfigForm | null>(null)
const problems = ref<ContestConfigQueryResult['problems']>([])
const problemToAdd = ref<number | null>(null)

const loading = ref(false)
const saving = ref(false)

async function fetch () {
  loading.value = true
  const resp = await getConfig(contestId.value)
  loading.value = false
  if (!resp.success || !resp.data) {
    message.error(t('ptoj.request_error_occurred'), resp.message)
    return
  }
  contestConfig.value = resp.data
  form.value = {
    title: resp.data.title,
    startsAt: new Date(resp.data.startsAt),
    endsAt: new Date(resp.data.endsAt),
    scoreboardFrozenAt: resp.data.scoreboardFrozenAt ? new Date(resp.data.scoreboardFrozenAt) : null,
    scoreboardUnfrozenAt: resp.data.scoreboardUnfrozenAt ? new Date(resp.data.scoreboardUnfrozenAt) : null,
    isHidden: resp.data.isHidden,
    isPublic: resp.data.isPublic,
    password: resp.data.password,
    labelingStyle: resp.data.labelingStyle,
  }
  problems.value = resp.data.problems
}

function onProblemReorder (event: any) {
  problems.value = event.value
}

function onProblemRemove (problemId: number) {
  problems.value = problems.value.filter(p => p.problemId !== problemId)
}

async function addProblem () {
  if (!problemToAdd.value) {
    message.warn(t('oj.select_problems_first') || 'Please pick a problem to add')
    return
  }
  if (problems.value.some(p => p.problemId === problemToAdd.value)) {
    message.info(t('ptoj.already_exists') || 'Problem already added')
    problemToAdd.value = null
    return
  }
  try {
    const { problem } = await problemStore.findOne({ pid: problemToAdd.value })
    problems.value.push({
      problemId: (problem as any).problemId ?? problem.pid,
      title: problem.title,
    })
    message.success(t('ptoj.add_success') || 'Problem added')
  } catch (error: any) {
    message.error(t('ptoj.failed_to_fetch') || 'Failed to load problem', error?.message)
  } finally {
    problemToAdd.value = null
  }
}

function buildPayload (): ContestConfigEditPayload | null {
  if (!form.value) return null
  if (form.value.endsAt <= form.value.startsAt) {
    message.error(t('ptoj.ends_before_start') || 'End time must be after start time')
    return null
  }
  const payload: ContestConfigEditPayload = {}

  if (form.value.title.trim() !== contestConfig.value?.title) {
    payload.title = form.value.title.trim()
  }
  if (form.value.startsAt.getTime() !== new Date(contestConfig.value!.startsAt).getTime()) {
    payload.startsAt = form.value.startsAt
  }
  if (form.value.endsAt.getTime() !== new Date(contestConfig.value!.endsAt).getTime()) {
    payload.endsAt = form.value.endsAt
  }
  if ((form.value.scoreboardFrozenAt?.getTime() ?? null)
    !== (contestConfig.value!.scoreboardFrozenAt ? new Date(contestConfig.value!.scoreboardFrozenAt).getTime() : null)) {
    payload.scoreboardFrozenAt = form.value.scoreboardFrozenAt
  }
  if ((form.value.scoreboardUnfrozenAt?.getTime() ?? null)
    !== (contestConfig.value!.scoreboardUnfrozenAt ? new Date(contestConfig.value!.scoreboardUnfrozenAt).getTime() : null)) {
    payload.scoreboardUnfrozenAt = form.value.scoreboardUnfrozenAt
  }
  if (form.value.isHidden !== contestConfig.value?.isHidden) {
    payload.isHidden = form.value.isHidden
  }
  if (form.value.isPublic !== contestConfig.value?.isPublic) {
    payload.isPublic = form.value.isPublic
  }
  if (form.value.isPublic === false && (form.value.password || null) !== contestConfig.value?.password) {
    payload.password = form.value.password || null
  }
  if (form.value.labelingStyle !== contestConfig.value?.labelingStyle) {
    payload.labelingStyle = form.value.labelingStyle
  }
  const currentProblemIds = contestConfig.value?.problems.map(p => p.problemId) || []
  const newProblemIds = problems.value.map(p => p.problemId)
  if (JSON.stringify(currentProblemIds) !== JSON.stringify(newProblemIds)) {
    payload.problems = newProblemIds
  }
  return payload
}

async function onSave () {
  const payload = buildPayload()
  if (!payload) return
  saving.value = true
  const resp = await updateConfig(contestId.value, payload)
  saving.value = false
  if (!resp.success) {
    message.error(t('ptoj.save_failed') || 'Failed to save contest', resp.message)
    return
  }
  message.success(t('ptoj.save_success') || 'Contest updated')
  fetch()
}

onMounted(fetch)
</script>

<template>
  <div v-if="form" class="max-w-5xl p-0">
    <div class="border-b border-surface gap-x-4 gap-y-6 grid grid-cols-1 md:grid-cols-2 p-6">
      <h2 class="-mb-1.75 font-semibold md:col-span-2 text-lg">
        Basic Information
      </h2>
      <IftaLabel class="md:col-span-2">
        <InputText id="title" v-model="form.title" fluid />
        <label for="title">Title</label>
      </IftaLabel>
      <IftaLabel>
        <DatePicker
          v-model="form.startsAt" show-time show-seconds date-format="yy-mm-dd" time-format="HH:mm:ss"
          :step-second="15" fluid required
        />
        <label for="startsAt">Starts At</label>
      </IftaLabel>
      <IftaLabel>
        <DatePicker
          v-model="form.endsAt" show-time show-seconds date-format="yy-mm-dd" time-format="HH:mm:ss"
          :step-second="15" fluid required
        />
        <label for="endsAt">Ends At</label>
      </IftaLabel>
      <IftaLabel>
        <DatePicker
          v-model="form.scoreboardFrozenAt" show-time show-seconds date-format="yy-mm-dd"
          time-format="HH:mm:ss" :step-second="15" fluid show-clear
        />
        <label for="scoreboardFrozenAt">Scoreboard Frozen At</label>
      </IftaLabel>
      <IftaLabel>
        <DatePicker
          v-model="form.scoreboardUnfrozenAt" show-time show-seconds date-format="yy-mm-dd"
          time-format="HH:mm:ss" :step-second="15" fluid show-clear
        />
        <label for="scoreboardUnfrozenAt">Scoreboard Unfrozen At</label>
      </IftaLabel>
    </div>

    <div class="border-b border-surface gap-x-4 gap-y-6 grid grid-cols-1 md:grid-cols-2 p-6">
      <h2 class="-mb-1.75 font-semibold md:col-span-2 text-lg">
        Access & Visibility
      </h2>
      <div
        class="bg-(--p-content-background) border border-surface-300/60 flex items-center justify-between px-4 py-3 rounded-lg"
      >
        <div class="flex flex-col">
          <span class="font-medium">Hidden</span>
          <span class="text-muted-color text-sm">Hide contest from listings</span>
        </div>
        <InputSwitch v-model="form.isHidden" />
      </div>
      <div
        class="bg-(--p-content-background) border border-surface-300/60 flex items-center justify-between px-4 py-3 rounded-lg"
      >
        <div class="flex flex-col">
          <span class="font-medium">Public</span>
          <span class="text-muted-color text-sm">No password needed to join</span>
        </div>
        <InputSwitch v-model="form.isPublic" />
      </div>
      <IftaLabel>
        <InputText id="password" v-model="form.password" :disabled="form.isPublic" fluid autocomplete="new-password" />
        <label for="password">Password</label>
      </IftaLabel>
    </div>

    <div class="gap-x-4 gap-y-6 grid grid-cols-1 md:grid-cols-2 p-6">
      <h2 class="-mb-1.75 font-semibold md:col-span-2 text-lg">
        Problems
      </h2>
      <IftaLabel>
        <Select
          v-model="form.labelingStyle" :options="[
            { label: 'Numeric', value: contestLabelingStyle.numeric },
            { label: 'Alphabetic', value: contestLabelingStyle.alphabetic },
          ]" option-label="label" option-value="value" fluid
        />
        <label for="scoreboardUnfrozenAt">Labeling Style</label>
      </IftaLabel>
      <div class="flex flex-col gap-2">
        <ProblemSelect v-model="problemToAdd" :course="courseId" />
        <div class="flex gap-2">
          <Button icon="pi pi-plus" label="Add Problem" @click="addProblem" />
          <Button icon="pi pi-refresh" label="Reload" severity="secondary" text @click="fetch" />
        </div>
      </div>
      <DataTable :value="problems" class="-mt-5 -mx-6 md:col-span-2" reorderable-rows @row-reorder="onProblemReorder">
        <Column row-reorder class="pb-1.5 pl-7 pt-2.5 w-16" />
        <Column field="problemId" class="text-center w-12">
          <template #header>
            <span class="text-center w-full">
              <i class="pi pi-hashtag" />
            </span>
          </template>
        </Column>
        <Column field="title" :header="t('ptoj.problem')" />
        <Column class="pr-6 py-1 w-16">
          <template #body="{ data }">
            <Button icon="pi pi-trash" severity="danger" text @click="onProblemRemove(data.problemId)" />
          </template>
        </Column>
        <template #empty>
          <span class="px-2">
            {{ t('ptoj.empty_content_desc') }}
          </span>
        </template>
      </DataTable>
    </div>

    <div class="flex gap-3 justify-end mb-6 mx-6">
      <Button label="Save Changes" :loading="saving" icon="pi pi-save" @click="onSave" />
    </div>
  </div>
  <div v-else class="flex h-64 items-center justify-center text-muted-color">
    <i class="mr-2 pi pi-spin pi-spinner" />
    <span>{{ loading ? t('ptoj.loading') : t('ptoj.unknown_error_occurred') }}</span>
  </div>
</template>
