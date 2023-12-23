<script setup>
import { storeToRefs } from 'pinia'
import { inject, onBeforeUnmount, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import OjContestEdit from '@/components/ContestEdit'
import { useContestStore } from '@/store/modules/contest'

const { t } = useI18n()
const contestStore = useContestStore()
const router = useRouter()
const $Message = inject('$Message')

const { overview, contest } = $(storeToRefs(contestStore))
const { update, findOne } = contestStore
const editingContest = reactive(Object.assign({}, contest))

async function submit () {
  const cid = await update(editingContest)
  $Message.success(`update contest ${cid} success!`)
  router.push({ name: 'contestOverview', params: cid })
}

// We are editing the contest model and so if we do not request data again,
// the data might be out-of-dated.
onBeforeUnmount(() => findOne({ cid: contest.cid }))
</script>

<template>
  <div v-if="contest" class="conadd-wrap">
    <OjContestEdit :contest="editingContest" :overview="overview" />
    <Button type="primary" @click="submit">
      {{ t('oj.submit') }}
    </Button>
  </div>
</template>
