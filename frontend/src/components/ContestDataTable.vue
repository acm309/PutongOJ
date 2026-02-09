<script setup lang="ts">
import type { ContestListQueryResult, ContestParticipationQueryResult } from '@putongoj/shared'
import { ParticipationStatus } from '@putongoj/shared'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import IftaLabel from 'primevue/iftalabel'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getParticipation, participateContest } from '@/api/contest'
import router from '@/router'
import { useRootStore } from '@/store'
import { timePretty } from '@/utils/format'
import { useMessage } from '@/utils/message'

const props = defineProps<{
  value: ContestListQueryResult['docs']
  sortField?: string
  sortOrder?: number
  loading?: boolean
}>()
const emit = defineEmits<{
  (e: 'sort', event: any): void
}>()

const { t } = useI18n()
const message = useMessage()
const rootStore = useRootStore()
const { currentTime } = storeToRefs(rootStore)

function handleSort (event: any) {
  emit('sort', event)
}

const details = ref<ContestParticipationQueryResult | null>(null)
const currentContestId = ref<number | null>(null)
const loading = ref(false)
const dialog = ref(false)
const password = ref('')

function closeDialog () {
  dialog.value = false
}

function gotoContest (contestId: number) {
  dialog.value = false
  router.push({ name: 'ContestOverview', params: { contestId } })
}

enum ApplyStatus {
  CanApply,
  NeedPassword,
  CannotApply,
}

const applyStatus = computed(() => {
  if (!details.value) {
    return ApplyStatus.CannotApply
  }
  if (details.value.participation !== ParticipationStatus.NotApplied) {
    return ApplyStatus.CannotApply
  }
  if (details.value.canParticipate) {
    return ApplyStatus.CanApply
  }
  if (details.value.canParticipateByPassword) {
    return ApplyStatus.NeedPassword
  }
  return ApplyStatus.CannotApply
})

const canApply = computed(() => {
  return applyStatus.value !== ApplyStatus.CannotApply
})

const canSubmit = computed(() => {
  if (applyStatus.value === ApplyStatus.CanApply) {
    return true
  }
  if (applyStatus.value === ApplyStatus.NeedPassword) {
    return password.value.length > 0
  }
  return false
})

async function onOpenContest (contestId: number) {
  currentContestId.value = contestId
  dialog.value = true

  loading.value = true
  const resp = await getParticipation(contestId)
  loading.value = false
  if (!resp.success) {
    message.error(t('ptoj.failed_fetch_data'), resp.message)
    return closeDialog()
  }
  details.value = resp.data
  password.value = ''

  if (
    details.value.participation === ParticipationStatus.Approved
    || details.value.isJury
  ) {
    gotoContest(contestId)
  }
}

async function onSubmit () {
  if (!details.value || !canSubmit.value) {
    return
  }

  loading.value = true
  const resp = await participateContest(currentContestId.value!, {
    password: applyStatus.value === ApplyStatus.NeedPassword ? password.value : undefined,
  })
  loading.value = false

  if (!resp.success) {
    message.error(t('ptoj.failed_join_contest'), t('ptoj.failed_join_contest_detail'))
    return
  }
  gotoContest(currentContestId.value!)
}
</script>

<template>
  <DataTable
    class="-mb-px whitespace-nowrap" :value="props.value" sort-mode="single" :sort-field="props.sortField"
    :sort-order="props.sortOrder" data-key="contestId" :lazy="true" :loading="props.loading" scrollable
    selection-mode="single" @sort="handleSort" @row-select="e => onOpenContest(e.data.contestId)"
  >
    <Column class="pl-8 text-center w-18" field="contestId" frozen>
      <template #header>
        <span class="text-center w-full">
          <i class="pi pi-hashtag" />
        </span>
      </template>
    </Column>

    <Column :header="t('ptoj.contest')" class="min-w-96">
      <template #body="{ data }">
        <span class="flex gap-4 items-center justify-between">
          <a @click="onOpenContest(data.contestId)">
            {{ data.title }}
          </a>
          <span class="-my-2 flex gap-1 justify-end">
            <Tag v-if="data.isHidden" :value="t('ptoj.hidden')" severity="secondary" />
          </span>
        </span>
      </template>
    </Column>

    <Column class="text-center w-24">
      <template #header>
        <span class="text-center w-full">
          <i class="pi pi-calendar-clock" />
        </span>
      </template>
      <template #body="{ data }">
        <span v-if="new Date(currentTime) < new Date(data.startsAt)">
          <span class="font-bold text-blue-500">{{ t('ptoj.upcoming') }}</span>
        </span>
        <span v-else-if="new Date(currentTime) < new Date(data.endsAt)">
          <span class="font-bold text-red-500">{{ t('ptoj.running') }}</span>
        </span>
        <span v-else>
          <span class="font-bold">{{ t('ptoj.ended') }}</span>
        </span>
      </template>
    </Column>

    <Column class="text-center w-24">
      <template #header>
        <span class="text-center w-full">
          <i class="pi pi-key" />
        </span>
      </template>
      <template #body="{ data }">
        <Tag
          :value="data.isPublic ? t('ptoj.public') : t('ptoj.private')"
          :severity="data.isPublic ? 'success' : 'warn'" class="-my-2"
        />
      </template>
    </Column>

    <Column
      v-if="props.sortField !== 'endsAt'" field="startsAt" :header="t('ptoj.starts_at')" class="pr-6 w-48"
      :sortable="true"
    >
      <template #body="{ data }">
        {{ timePretty(data.startsAt) }}
      </template>
    </Column>

    <Column v-else field="endsAt" :header="t('ptoj.ends_at')" class="pr-6 w-48" :sortable="true">
      <template #body="{ data }">
        {{ timePretty(data.endsAt) }}
      </template>
    </Column>
  </DataTable>

  <Dialog v-model:visible="dialog" :header="t('ptoj.participate_contest')" modal class="mx-6 w-md" :closable="false">
    <div v-if="loading || !details" class="flex items-center justify-center min-h-30 pb-8">
      <i class="pi pi-spin pi-spinner text-3xl text-primary" />
    </div>
    <form v-else class="flex flex-col gap-4 justify-between min-h-30">
      <div v-if="applyStatus === ApplyStatus.CanApply" class="text-muted-color">
        {{ t('ptoj.participate_contest_confirm') }}
      </div>
      <div v-else-if="applyStatus === ApplyStatus.NeedPassword" class="flex flex-col">
        <IftaLabel v-if="!details.canParticipate">
          <InputText id="title" v-model="password" fluid :placeholder="t('ptoj.enter_password')" type="password" required autocomplete="off" />
          <label for="title">{{ t('ptoj.password') }}</label>
        </IftaLabel>
      </div>
      <div v-else class="text-muted-color">
        {{ t('ptoj.participate_contest_cannot_apply') }}
      </div>
      <div class="flex gap-2 justify-end">
        <Button type="button" :label="t('ptoj.close')" outlined severity="secondary" @click="closeDialog()" />
        <Button v-if="canApply" type="submit" :label="t('ptoj.participate')" :disabled="!canSubmit" @click="onSubmit" />
      </div>
    </form>
  </Dialog>
</template>
