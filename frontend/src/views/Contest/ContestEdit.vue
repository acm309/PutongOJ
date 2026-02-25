<script setup lang="ts">
import type { ContestConfigEditPayload, ContestConfigQueryResult } from '@putongoj/shared'
import { LabelingStyle } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import DatePicker from 'primevue/datepicker'
import IftaLabel from 'primevue/iftalabel'
import InputGroup from 'primevue/inputgroup'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getConfig, updateConfig } from '@/api/contest'
import LabeledSwitch from '@/components/LabeledSwitch.vue'
import { useContestStore } from '@/store/modules/contest'
import { useProblemStore } from '@/store/modules/problem'
import { useMessage } from '@/utils/message'

type ContestConfigForm = Required<Pick<ContestConfigEditPayload, 'title'
  | 'startsAt' | 'endsAt' | 'scoreboardFrozenAt' | 'scoreboardUnfrozenAt'
  | 'isHidden' | 'isPublic' | 'password'
  | 'labelingStyle'>>

const { t } = useI18n()
const message = useMessage()
const problemStore = useProblemStore()
const contestStore = useContestStore()

const { contestId } = storeToRefs(contestStore)
const contestConfig = ref<ContestConfigQueryResult | null>(null)

const form = ref<ContestConfigForm | null>(null)
const problems = ref<ContestConfigQueryResult['problems']>([])
const problemToAdd = ref<number | null>(null)
const enablePassword = ref(false)

const loading = ref(false)
const savingBasicInfo = ref(false)
const savingAccess = ref(false)
const savingProblems = ref(false)

const ipWhitelistEnabled = ref(false)
const ipWhitelist = ref<{ _key: number, cidr: string, comment: string | null }[]>([])
const ipWhitelistEditingRows = ref<any[]>([])
let ipWhitelistKeyCounter = 0

function makeIpEntry (cidr = '', comment: string | null = null) {
  return { _key: ipWhitelistKeyCounter++, cidr, comment }
}

function onIpWhitelistRowEditSave (event: any) {
  const { newData, index } = event
  ipWhitelist.value[index] = newData
}

function onIpWhitelistAddEntry () {
  ipWhitelist.value = [ ...ipWhitelist.value, makeIpEntry() ]
  ipWhitelistEditingRows.value = [ ...ipWhitelistEditingRows.value, ipWhitelist.value[ipWhitelist.value.length - 1] ]
}

const basicInfoDirty = computed(() => {
  if (!form.value || !contestConfig.value) return false
  return (
    form.value.title.trim() !== contestConfig.value.title
    || form.value.startsAt.getTime() !== new Date(contestConfig.value.startsAt).getTime()
    || form.value.endsAt.getTime() !== new Date(contestConfig.value.endsAt).getTime()
    || (form.value.scoreboardFrozenAt?.getTime() ?? null)
    !== (contestConfig.value.scoreboardFrozenAt ? new Date(contestConfig.value.scoreboardFrozenAt).getTime() : null)
    || (form.value.scoreboardUnfrozenAt?.getTime() ?? null)
    !== (contestConfig.value.scoreboardUnfrozenAt ? new Date(contestConfig.value.scoreboardUnfrozenAt).getTime() : null)
  )
})

const accessDirty = computed(() => {
  if (!form.value || !contestConfig.value) return false
  const originalPassword = contestConfig.value.password || null
  const currentPassword = enablePassword.value ? (form.value.password || null) : null
  const originalIpWhitelist = JSON.stringify((contestConfig.value.ipWhitelist ?? []).map(e => ({ cidr: e.cidr, comment: e.comment })))
  const currentIpWhitelist = JSON.stringify(ipWhitelist.value.map(e => ({ cidr: e.cidr, comment: e.comment })))
  return (
    form.value.isHidden !== contestConfig.value.isHidden
    || form.value.isPublic !== contestConfig.value.isPublic
    || currentPassword !== originalPassword
    || ipWhitelistEnabled.value !== contestConfig.value.ipWhitelistEnabled
    || currentIpWhitelist !== originalIpWhitelist
  )
})

const problemsDirty = computed(() => {
  if (!form.value || !contestConfig.value) return false
  const currentProblemIds = contestConfig.value.problems.map(p => p.problemId) || []
  const newProblemIds = problems.value.map(p => p.problemId)
  return (
    form.value.labelingStyle !== contestConfig.value.labelingStyle
    || JSON.stringify(currentProblemIds) !== JSON.stringify(newProblemIds)
  )
})

async function fetch () {
  loading.value = true
  const resp = await getConfig(contestId.value)
  loading.value = false
  if (!resp.success || !resp.data) {
    message.error(t('ptoj.failed_fetch_data'), resp.message)
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
    password: resp.data.password || '',
    labelingStyle: resp.data.labelingStyle,
  }
  problems.value = resp.data.problems
  enablePassword.value = !!resp.data.password
  ipWhitelistEnabled.value = resp.data.ipWhitelistEnabled
  ipWhitelist.value = (resp.data.ipWhitelist ?? []).map(e => makeIpEntry(e.cidr, e.comment))
}

function onProblemReorder (event: any) {
  problems.value = event.value
}

function onProblemRemove (problemId: number) {
  problems.value = problems.value.filter(p => p.problemId !== problemId)
}

async function addProblem () {
  if (!problemToAdd.value) {
    message.warn(t('ptoj.failed_add_problem'), t('ptoj.select_problems_first'))
    return
  }
  if (problems.value.some(p => p.problemId === problemToAdd.value)) {
    message.info(t('ptoj.failed_add_problem'), t('ptoj.problem_already_added'))
    problemToAdd.value = null
    return
  }

  try {
    const { problem } = await problemStore.findOne({ pid: problemToAdd.value })
    problems.value.push({
      problemId: (problem as any).problemId ?? problem.pid,
      title: problem.title,
    })
  } catch (error: any) {
    message.error(t('ptoj.failed_proceed'), error?.message)
  } finally {
    problemToAdd.value = null
  }
}

async function saveChanges (payload: Partial<ContestConfigEditPayload>) {
  if (Object.keys(payload).length === 0) {
    return
  }

  const resp = await updateConfig(contestId.value, payload)
  if (!resp.success) {
    message.error(t('ptoj.failed_update_contest'), resp.message)
    return
  }
  message.success(
    t('ptoj.successful_update_contest'),
    t('ptoj.successful_update_contest_detail', { title: form.value!.title }),
  )

  fetch()
  contestStore.reloadContest()
}

async function onSaveBasicInfo () {
  if (!form.value || !contestConfig.value) return
  if (form.value.endsAt <= form.value.startsAt) {
    message.error(t('ptoj.failed_update_contest'), t('ptoj.contest_end_must_be_after_start'))
    return
  }

  const payload: Partial<ContestConfigEditPayload> = {}
  if (form.value.title.trim() !== contestConfig.value.title) {
    payload.title = form.value.title.trim()
  }
  if (form.value.startsAt.getTime() !== new Date(contestConfig.value.startsAt).getTime()) {
    payload.startsAt = form.value.startsAt
  }
  if (form.value.endsAt.getTime() !== new Date(contestConfig.value.endsAt).getTime()) {
    payload.endsAt = form.value.endsAt
  }
  if ((form.value.scoreboardFrozenAt?.getTime() ?? null)
    !== (contestConfig.value.scoreboardFrozenAt ? new Date(contestConfig.value.scoreboardFrozenAt).getTime() : null)) {
    payload.scoreboardFrozenAt = form.value.scoreboardFrozenAt
  }
  if ((form.value.scoreboardUnfrozenAt?.getTime() ?? null)
    !== (contestConfig.value.scoreboardUnfrozenAt ? new Date(contestConfig.value.scoreboardUnfrozenAt).getTime() : null)) {
    payload.scoreboardUnfrozenAt = form.value.scoreboardUnfrozenAt
  }

  savingBasicInfo.value = true
  await saveChanges(payload)
  savingBasicInfo.value = false
}

async function onSaveAccess () {
  if (!form.value || !contestConfig.value) return

  const payload: Partial<ContestConfigEditPayload> = {}
  if (form.value.isHidden !== contestConfig.value.isHidden) {
    payload.isHidden = form.value.isHidden
  }
  if (form.value.isPublic !== contestConfig.value.isPublic) {
    payload.isPublic = form.value.isPublic
  }

  const currentPassword = enablePassword.value ? (form.value.password || null) : null
  const originalPassword = contestConfig.value.password || null
  if (currentPassword !== originalPassword) {
    payload.password = currentPassword
  }

  if (ipWhitelistEnabled.value !== contestConfig.value.ipWhitelistEnabled) {
    payload.ipWhitelistEnabled = ipWhitelistEnabled.value
  }
  const originalIpWhitelist = JSON.stringify((contestConfig.value.ipWhitelist ?? []).map(e => ({ cidr: e.cidr, comment: e.comment })))
  if (JSON.stringify(ipWhitelist.value.map(e => ({ cidr: e.cidr, comment: e.comment }))) !== originalIpWhitelist) {
    payload.ipWhitelist = ipWhitelist.value.map(({ cidr, comment }) => ({ cidr, comment }))
  }

  savingAccess.value = true
  await saveChanges(payload)
  savingAccess.value = false
}

async function onSaveProblems () {
  if (!form.value || !contestConfig.value) return

  const payload: Partial<ContestConfigEditPayload> = {}
  if (form.value.labelingStyle !== contestConfig.value.labelingStyle) {
    payload.labelingStyle = form.value.labelingStyle
  }

  const currentProblemIds = problems.value.map(p => p.problemId)
  const originalProblemIds = contestConfig.value.problems.map(p => p.problemId) || []
  if (JSON.stringify(currentProblemIds) !== JSON.stringify(originalProblemIds)) {
    payload.problems = currentProblemIds
  }

  savingProblems.value = true
  await saveChanges(payload)
  savingProblems.value = false
}

onMounted(() => {
  fetch()
})
</script>

<template>
  <div v-if="form" class="max-w-5xl p-0">
    <div class="border-b border-surface gap-x-4 gap-y-6 grid grid-cols-1 md:grid-cols-2 p-6">
      <h2 class="-mb-1.75 font-semibold md:col-span-2 text-lg">
        {{ t('ptoj.basic_information') }}
      </h2>

      <IftaLabel class="md:col-span-2">
        <InputText id="title" v-model="form.title" fluid />
        <label for="title">{{ t('ptoj.title') }}</label>
      </IftaLabel>

      <IftaLabel>
        <DatePicker
          v-model="form.startsAt" show-time show-seconds date-format="yy-mm-dd" time-format="HH:mm:ss"
          :step-second="15" fluid required
        />
        <label for="startsAt">{{ t('ptoj.starts_at') }}</label>
      </IftaLabel>

      <IftaLabel>
        <DatePicker
          v-model="form.endsAt" show-time show-seconds date-format="yy-mm-dd" time-format="HH:mm:ss"
          :step-second="15" fluid required
        />
        <label for="endsAt">{{ t('ptoj.ends_at') }}</label>
      </IftaLabel>

      <IftaLabel>
        <DatePicker
          v-model="form.scoreboardFrozenAt" show-time show-seconds date-format="yy-mm-dd"
          time-format="HH:mm:ss" :step-second="15" fluid show-clear :placeholder="t('ptoj.scoreboard_frozen_at_desc')"
        />
        <label for="scoreboardFrozenAt">{{ t('ptoj.scoreboard_frozen_at') }}</label>
      </IftaLabel>
      <IftaLabel>
        <DatePicker
          v-model="form.scoreboardUnfrozenAt" show-time show-seconds date-format="yy-mm-dd"
          time-format="HH:mm:ss" :step-second="15" fluid show-clear :placeholder="t('ptoj.scoreboard_unfrozen_at_desc')"
        />
        <label for="scoreboardUnfrozenAt">{{ t('ptoj.scoreboard_unfrozen_at') }}</label>
      </IftaLabel>

      <div class="flex gap-3 justify-end md:col-span-2">
        <Button
          :label="t('ptoj.save_changes')" :loading="savingBasicInfo" icon="pi pi-save" :disabled="!basicInfoDirty"
          @click="onSaveBasicInfo"
        />
      </div>
    </div>

    <div class="border-b border-surface gap-x-4 gap-y-6 grid grid-cols-1 md:grid-cols-2 p-6">
      <h2 class="-mb-1.75 font-semibold md:col-span-2 text-lg">
        {{ t('ptoj.access_control') }}
      </h2>

      <LabeledSwitch v-model="form.isHidden" :label="t('ptoj.hidden')" :description="t('ptoj.hide_from_listings')" />

      <LabeledSwitch v-model="form.isPublic" :label="t('ptoj.public')" :description="t('ptoj.anyone_can_join')" />

      <LabeledSwitch
        v-if="!form.isPublic" v-model="enablePassword" :label="t('ptoj.join_via_password')"
        :description="t('ptoj.allow_joining_via_password')"
      />

      <IftaLabel v-if="!form.isPublic && enablePassword">
        <InputText id="password" v-model="form.password" fluid autocomplete="new-password" />
        <label for="password">{{ t('ptoj.password') }}</label>
      </IftaLabel>

      <LabeledSwitch
        v-model="ipWhitelistEnabled" :label="t('ptoj.enable_ip_whitelist')"
        :description="t('ptoj.ip_whitelist_desc')"
      />

      <DataTable
        v-if="ipWhitelistEnabled" v-model:editing-rows="ipWhitelistEditingRows" :value="ipWhitelist" edit-mode="row" scrollable
        data-key="_key" class="-mt-3 -mx-6 md:col-span-2 whitespace-nowrap" @row-edit-save="onIpWhitelistRowEditSave"
      >
        <Column field="cidr" :header="t('ptoj.cidr')" class="pl-6" body-class="h-[59px]">
          <template #editor="{ data, field }">
            <InputText v-model="data[field]" fluid placeholder="192.168.0.0/24" />
          </template>
        </Column>

        <Column field="comment" :header="t('ptoj.note')">
          <template #editor="{ data, field }">
            <InputText v-model="data[field]" fluid />
          </template>
        </Column>

        <Column :row-editor="true" class="pr-0 text-right w-20" />
        <Column class="-my-2 pl-0 pr-6 w-10">
          <template #body="{ data }">
            <Button
              icon="pi pi-trash" rounded severity="danger" text
              @click="ipWhitelist = ipWhitelist.filter(e => e._key !== data._key)"
            />
          </template>
        </Column>

        <template #footer>
          <div class="px-2">
            <Button :label="t('ptoj.add')" fluid icon="pi pi-plus" text @click="onIpWhitelistAddEntry" />
          </div>
        </template>

        <template #empty>
          <div class="px-2">
            <div class="max-w-xl mx-auto text-balance text-center">
              {{ t('ptoj.empty_ip_whitelist_desc') }}
            </div>
          </div>
        </template>
      </DataTable>

      <div class="flex gap-3 justify-end md:col-span-2">
        <Button
          :label="t('ptoj.save_changes')" :loading="savingAccess" icon="pi pi-save" :disabled="!accessDirty"
          @click="onSaveAccess"
        />
      </div>
    </div>

    <div class="gap-x-4 gap-y-6 grid grid-cols-1 md:grid-cols-2 p-6">
      <h2 class="-mb-1.75 font-semibold md:col-span-2 text-lg">
        {{ t('ptoj.problems') }}
      </h2>

      <DataTable :value="problems" class="-mt-2 -mx-6 md:col-span-2" reorderable-rows @row-reorder="onProblemReorder">
        <Column field="problemId" class="pl-6 text-center w-20">
          <template #header>
            <span class="text-center w-full">
              <i class="pi pi-hashtag" />
            </span>
          </template>
        </Column>

        <Column field="title" :header="t('ptoj.problem')" />

        <Column class="px-3 py-1 w-16">
          <template #body="{ data }">
            <Button icon="pi pi-trash" severity="danger" text @click="onProblemRemove(data.problemId)" />
          </template>
        </Column>

        <Column row-reorder class="pb-1.5 pr-6 pt-2.5 w-16" />

        <template #empty>
          <span class="px-2">
            {{ t('ptoj.empty_content_desc') }}
          </span>
        </template>
      </DataTable>

      <InputGroup>
        <IftaLabel>
          <InputNumber
            v-model="problemToAdd" :min="1" :use-grouping="false"
            :step="1" fluid
          />
          <label for="problemToAdd">{{ t('ptoj.problem_id') }}</label>
        </IftaLabel>
        <Button icon="pi pi-plus" class="px-6 whitespace-nowrap" :label="t('ptoj.add')" @click="addProblem" />
      </InputGroup>

      <IftaLabel>
        <Select
          v-model="form.labelingStyle" :options="[
            { label: t('ptoj.numeric_labeling'), value: LabelingStyle.Numeric },
            { label: t('ptoj.alphabetic_labeling'), value: LabelingStyle.Alphabetic },
          ]" option-label="label" option-value="value" fluid
        />
        <label for="scoreboardUnfrozenAt">{{ t('ptoj.labeling_style') }}</label>
      </IftaLabel>

      <div class="flex gap-3 justify-end md:col-span-2">
        <Button
          :label="t('ptoj.save_changes')" :loading="savingProblems" icon="pi pi-save" :disabled="!problemsDirty"
          @click="onSaveProblems"
        />
      </div>
    </div>
  </div>

  <div v-else class="flex h-64 items-center justify-center max-w-5xl text-muted-color">
    <i class="mr-2 pi pi-spin pi-spinner" />
    <span>{{ loading ? t('ptoj.loading') : t('ptoj.unknown_error_occurred') }}</span>
  </div>
</template>
