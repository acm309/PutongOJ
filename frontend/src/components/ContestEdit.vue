<script setup>
import only from 'only'
import { Button, Col, Icon, Row } from 'view-ui-plus'
import { inject, onBeforeMount, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import Draggable from 'vuedraggable'
import { useProblemStore } from '@/store/modules/problem'
import ProblemSelect from './ProblemSelect.vue'

const props = defineProps([ 'contest', 'overview' ])
const { t } = useI18n()
const problemStore = useProblemStore()
const route = useRoute()
const { findOne: findOneProblem } = problemStore
const { contest, overview } = $(toRefs(props))
const jobs = $ref({})

let pid = $ref('')

const $Message = inject('$Message')

if (typeof overview !== 'undefined') {
  overview.forEach((item) => {
    if (!item.invalid) return
    $Message.error(`Problem ${item.pid} is invalid, auto removed`)
    contest.list.splice(contest.list.indexOf(item.pid), 1)
  })
}

async function add () {
  if (!pid) {
    $Message.error('Please select a problem')
    return
  }
  const { problem } = await findOneProblem({ pid })
  contest.list.push(problem.pid)
  jobs[problem.pid] = problem.title
  pid = ''
}
function removeJob (index) {
  contest.list.splice(index, 1)
}

onBeforeMount(async () => {
  if (route.params.cid) {
    if (overview.length === 0)
      await findOne(only(route.params, 'cid'))
    overview.forEach(item => jobs[item.pid] = item.title)
  }
})
</script>

<template>
  <div>
    <!-- eslint-disable-next-line vue/no-mutating-props -->
    <Draggable v-model="contest.list" item-key="pid">
      <template #item="{ element, index }">
        <div class="problem-item">
          <p>{{ element }} -- {{ jobs[element] }}</p>
          <Icon type="md-close-circle" @click="removeJob(index)" />
        </div>
      </template>
    </Draggable>
    <Row :gutter="14">
      <Col flex="auto" class="mb-[20px]">
        <ProblemSelect v-model="pid" :course="contest.course?.courseId" @keyup.enter="add" />
      </Col>
      <Col flex="unset" class="ivu-mp-8">
        <Button type="primary" style="width: 100%" @click="add">
          {{ t('oj.add') }}
        </Button>
      </Col>
    </Row>
  </div>
</template>

<style lang="stylus" scoped>
.problem-item
  display: flex
  justify-content: space-between
  padding: 14px 20px
  margin-bottom: 14px
  background-color: #f2f2f2
</style>
