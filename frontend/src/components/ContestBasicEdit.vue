<script lang="ts" setup>
import type { Message } from 'view-ui-plus'
import { encrypt } from '@backend/utils/constants'
import { storeToRefs } from 'pinia'
import { DatePicker, Form, FormItem, Input, Option, Select } from 'view-ui-plus'
import { inject, onMounted, ref } from 'vue'
import { useContestStore } from '@/store/modules/contest'

const props = defineProps<{
  contestId: number
}>()

const contestStore = useContestStore()
const { contest } = storeToRefs(contestStore)
const { findOne: findContest } = contestStore
const message = inject('$Message') as typeof Message

const startsAt = ref(new Date())
const endsAt = ref(new Date())

async function syncValues () {
  if (!contest.value) {
    return
  }
  startsAt.value = new Date(contest.value.start)
  endsAt.value = new Date(contest.value.end)
}

async function updateDatetime (type: 'start' | 'end', time: string) {
  const date = new Date(time)

  switch (type) {
    case 'start':
      contest.value.start = date.getTime()
      if (date.getTime() >= contest.value.end) {
        contest.value.end = date.getTime() + 60 * 1000 * 60
        endsAt.value = new Date(contest.value.end)
        message.warning('Contest end time has been adjusted to be 1 hour after the start time.')
      }
      break
    case 'end':
      contest.value.end = date.getTime()
      if (date.getTime() <= contest.value.start) {
        contest.value.start = date.getTime() - 60 * 1000 * 60
        startsAt.value = new Date(contest.value.start)
        message.warning('Contest start time has been adjusted to be 1 hour before the end time.')
      }
      break
  }
}

onMounted(async () => {
  if (
    Number.isInteger(props.contestId)
    && props.contestId > 0
    && contest.value.cid !== props.contestId
  ) {
    await findContest({ cid: props.contestId })
  }
  await syncValues()
})
</script>

<template>
  <Form label-position="right" :label-width="120">
    <FormItem>
      <template #label>
        <span style="line-height: 20px;">Contest Title</span>
      </template>
      <Input v-model="contest.title" size="large" placeholder="Enter contest title" />
    </FormItem>
    <FormItem label="Starts At">
      <DatePicker
        class="contest-form-item" type="datetime" :model-value="startsAt" :clearable="false"
        :format="('yyyy-MM-dd HH:mm:ss' as any)" @on-change="(time: string) => updateDatetime('start', time)"
      />
    </FormItem>
    <FormItem label="Ends At">
      <DatePicker
        class="contest-form-item" type="datetime" :model-value="endsAt" :clearable="false"
        :format="('yyyy-MM-dd HH:mm:ss' as any)" @on-change="(time: string) => updateDatetime('end', time)"
      />
    </FormItem>
    <FormItem label="Encryption">
      <Select v-model="contest.encrypt" class="contest-form-item">
        <Option :value="encrypt.Public">
          Public
        </Option>
        <Option :value="encrypt.Private" disabled>
          Private
        </Option>
        <Option :value="encrypt.Password">
          Password
        </Option>
      </Select>
    </FormItem>
    <FormItem v-if="contest.encrypt === encrypt.Password" label="Password">
      <Input v-model="contest.argument" class="contest-form-item" type="password" password placeholder="Enter contest password" />
    </FormItem>
  </Form>
</template>

<style lang="stylus" scoped>
.contest-form-item
  width 100%
  max-width 384px
</style>

<style lang="stylus">
.ivu-picker-panel-content .ivu-picker-panel-content .ivu-time-picker-cells-with-seconds .ivu-time-picker-cells-list
  width 72px
</style>
