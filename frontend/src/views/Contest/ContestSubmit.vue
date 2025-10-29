<script setup>
import { storeToRefs } from 'pinia'
import { Button, Space } from 'view-ui-plus'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Submit from '@/components/Submit'
import { useContestStore } from '@/store/modules/contest'
import { useSolutionStore } from '@/store/modules/solution'
import { contestLabeling } from '@/utils/formate'

const { t } = useI18n()
const contestStore = useContestStore()
const solutionStore = useSolutionStore()
const route = useRoute()
const router = useRouter()
const message = inject('$Message')

const { problems, overview, contest, totalProblems } = $(storeToRefs(contestStore))
const { solution } = $(storeToRefs(solutionStore))
const { clearCode: reset, create } = solutionStore

const currentProblemId = $computed(() => Number(route.params.id))
const currentContestId = $computed(() => route.params.cid)
const currentTitle = $computed(() => overview[currentProblemId - 1]?.title)

const pid = $computed(() => problems[currentProblemId - 1])
const mid = $computed(() => currentContestId)

function pageChange (val) {
  if (overview[val - 1]?.invalid) return
  router.push({ name: 'contestSubmit', params: { cid: contest.cid, id: val } })
}

async function submit () {
  const response = await create({ pid, mid, ...solution })
  if (response.isAxiosError) return
  router.push({ name: 'ContestMySubmissions', params: route.params })
  message.info(t('oj.submitSuccess', { id: currentProblemId }))
}
</script>

<template>
  <div class="contest-children">
    <Space class="problem-nav" wrap :size="[8, 8]">
      <Button
        v-for="i in totalProblems" :key="i" class="problem-nav-item"
        :type="i === currentProblemId ? 'primary' : 'default'" :disabled="overview[i - 1]?.invalid"
        @click="pageChange(i)"
      >
        {{ contestLabeling(i, contest.option?.labelingStyle) }}
      </Button>
    </Space>
    <div class="problem-content">
      <h1>{{ currentProblemId }}: {{ currentTitle }}</h1>
      <Submit :pid="String(pid)" />
      <Button type="primary" @click="submit">
        {{ t('oj.submit') }}
      </Button>
      <Button style="margin-left: 8px" @click="reset">
        {{ t('oj.reset') }}
      </Button>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
.contest-children
  margin-top -16px
  padding 40px 0
  position relative

.problem-nav
  padding 0 40px
  .problem-nav-item
    padding 0 11.66px

.problem-content
  padding 20px 40px 0

@media screen and (max-width: 1024px)
  .contest-children
    padding 20px 0
  .problem-nav
    padding 0 20px
  .problem-content
    padding 10px 20px 0

h1
  color: #757575
  margin-top 10px
  margin-bottom 20px
  text-align center
</style>
