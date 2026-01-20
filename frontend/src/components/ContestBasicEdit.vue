<script setup lang="ts">
import { encrypt } from '@backend/utils/constants'
import { DatePicker, Form, FormItem, Input, Message, Option, Select } from 'view-ui-plus'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  contest: any
}>()
const { contest } = props
const { t } = useI18n()

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
        Message.warning(t('oj.contest_end_time_adjusted'))
      }
      break
    case 'end':
      contest.value.end = date.getTime()
      if (date.getTime() <= contest.value.start) {
        contest.value.start = date.getTime() - 60 * 1000 * 60
        startsAt.value = new Date(contest.value.start)
        Message.warning(t('oj.contest_start_time_adjusted'))
      }
      break
  }
}

onMounted(async () => {
  await syncValues()
})
</script>

<template>
  <Form label-position="right" :label-width="120">
    <FormItem>
      <template #label>
        <span style="line-height: 20px;">{{ t('oj.contest_title') }}</span>
      </template>
      <Input v-model="contest.title" size="large" :placeholder="t('oj.enter_contest_title')" />
    </FormItem>
    <FormItem :label="t('oj.starts_at')">
      <DatePicker
        class="contest-form-item" type="datetime" :model-value="startsAt" :clearable="false"
        :format="('yyyy-MM-dd HH:mm:ss' as any)" @on-change="(time: string) => updateDatetime('start', time)"
      />
    </FormItem>
    <FormItem :label="t('oj.ends_at')">
      <DatePicker
        class="contest-form-item" type="datetime" :model-value="endsAt" :clearable="false"
        :format="('yyyy-MM-dd HH:mm:ss' as any)" @on-change="(time: string) => updateDatetime('end', time)"
      />
    </FormItem>
    <FormItem :label="t('oj.encryption')">
      <Select v-model="contest.encrypt" class="contest-form-item">
        <Option :value="encrypt.Public">
          {{ t('oj.public') }}
        </Option>
        <Option :value="encrypt.Private" disabled>
          {{ t('oj.private') }}
        </Option>
        <Option :value="encrypt.Password">
          {{ t('oj.password') }}
        </Option>
      </Select>
    </FormItem>
    <FormItem v-if="contest.encrypt === encrypt.Password" :label="t('oj.password')">
      <Input v-model="contest.argument" class="contest-form-item" type="password" password :placeholder="t('oj.enter_contest_password')" />
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
