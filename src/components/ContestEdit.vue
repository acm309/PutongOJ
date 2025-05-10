<script setup>
import Draggable from 'vuedraggable'
import only from 'only'
import { storeToRefs } from 'pinia'
import { inject, onBeforeMount, toRefs, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { escape } from 'html-escaper'
import SearchableTransfer from './SearchableTransfer.vue'
import { useProblemStore } from '@/store/modules/problem'
import { useRootStore } from '@/store'
import { useGroupStore } from '@/store/modules/group'
import api from '@/api'

const props = defineProps([ 'contest', 'overview' ])
const { t } = useI18n()
const rootStore = useRootStore()
const problemStore = useProblemStore()
const groupStore = useGroupStore()
const route = useRoute()

const { encrypt } = $(storeToRefs(rootStore))
const { findOne: findOneProblem } = problemStore
const { list: groups } = $(storeToRefs(groupStore))

const { contest, overview } = $(toRefs(props))
const jobs = $ref({})
const options = [
  {
    value: 1,
    label: 'Public',
  },
  {
    value: 2,
    label: 'Private',
  },
  {
    value: 3,
    label: 'Password',
  },
]
let pid = $ref('')
let pwd = $ref('')

const $Message = inject('$Message')

if (typeof overview !== 'undefined') {
  contest.start = contest.start || new Date().getTime()
  contest.end = contest.end || new Date().getTime() + 60 * 1000 * 60
  if (contest.encrypt === encrypt.Password)
    pwd = contest.argument
  overview.forEach((item) => {
    if (!item.invalid) return
    $Message.error(`Problem ${item.pid} is invalid, auto removed`)
    contest.list.splice(contest.list.indexOf(item.pid), 1)
  })
}

async function add () {
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

// User search -- Contest of Private Type
const Spin = inject('$Spin')
let source = $ref([])
async function search (val) {
  try {
    Spin.show()
    const { data } = await api.user.find({ type: 'uid', content: val })
    source = data.docs.map(item => ({
      // Transfer component is using v-html, so we need to escape the html
      key: escape(item.uid),
      label: escape(`${item.uid} -- ${item.nick}`),
    })).sort((x, y) => x.key.localeCompare(y.key))
  } finally {
    Spin.hide()
  }
}
const result = $ref(
  +contest.encrypt === encrypt.Private
    ? contest.argument.split('\r\n')
    : [],
)

let selectedGroups = $ref([])

const groupOptions = $computed(() => groups.map(item => ({
  key: item.gid,
  label: item.title,
})))
const argument = $computed(() => {
  return result.concat(selectedGroups.map(item => `gid:${item}`)).join('\r\n')
})
function handleGroupChanges (data) {
  selectedGroups = data
}
function changeTime (label, time) {
  if (label === 'start')
    contest.start = time
  else
    contest.end = time
}

groupStore.find({ lean: 1 })

watch(() => contest.encrypt, async (val) => {
  if (val === encrypt.Password)
    contest.argument = pwd
  else if (val === encrypt.Private)
    contest.argument = argument
})
watch($$(pwd), () => contest.argument = pwd)
watch($$(result), () => contest.argument = argument)
// Do not return any value for onBeforeRouteLeave
onBeforeRouteLeave(() => { source = [] })
</script>

<template>
  <div>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        {{ t('oj.title') }}
      </Col>
      <Col :span="21">
        <!-- eslint-disable-next-line vue/no-mutating-props -->
        <Input v-model="contest.title" />
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Start Time
      </Col>
      <Col :span="8">
        <DatePicker
          type="datetime"
          :model-value="new Date(contest.start)"
          format="yyyy-MM-dd HH:mm:ss"
          @on-change="(time) => changeTime('start', time)"
        />
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        End Time
      </Col>
      <Col :span="8">
        <DatePicker
          type="datetime"
          :model-value="new Date(contest.end)"
          format="yyyy-MM-dd HH:mm:ss"
          @on-change="(time) => changeTime('end', time)"
        />
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        {{ t('oj.type') }}
      </Col>
      <Col :span="4">
        <!-- eslint-disable-next-line vue/no-mutating-props -->
        <Select v-model="contest.encrypt">
          <Option
            v-for="item in options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </Select>
      </Col>
    </Row>
    <SearchableTransfer
      v-if="+contest.encrypt === encrypt.Private" :key="encrypt.Private"
      v-model:result="result" :source="source"
      @on-search="search"
    />
    <Transfer
      v-if="+contest.encrypt === encrypt.Private"
      class="group-transfer"
      :data="groupOptions"
      :target-keys="selectedGroups"
      @on-change="handleGroupChanges"
    />
    <Row v-if="contest.encrypt === encrypt.Password" :key="encrypt.Password">
      <Col :span="23">
        <Input v-model="pwd" />
      </Col>
    </Row>
    <Row>
      <Col :span="23">
        <hr>
      </Col>
    </Row>
    <Row>
      <Col :span="23">
        <!-- eslint-disable-next-line vue/no-mutating-props -->
        <Draggable v-model="contest.list" item-key="pid">
          <template #item="{ element, index }">
            <div class="list-item">
              <p>{{ element }} -- {{ jobs[element] }}</p>
              <Icon type="md-close-circle" @click="removeJob(index)" />
            </div>
          </template>
        </Draggable>
      </Col>
    </Row>
    <Row>
      <Col :span="21" class="add">
        <Input v-model="pid" placeholder="Add a pid" @keyup.enter="add" />
      </Col>
      <Col :span="3" class="ivu-mp-8">
        <Button type="primary" class="ivu-ml-8" @click="add">
          {{ t('oj.add') }}
        </Button>
      </Col>
    </Row>
    <Row>
      <Col :span="23">
        <hr>
      </Col>
    </Row>
  </div>
</template>

<style lang="stylus" scoped>
.ivu-row, .ivu-row-flex
  margin-bottom: 14px
.ivu-col
  text-align: left
  font-size: 16px
.label
  line-height: 32px
  hr
    background-color: #dbdbdb
    border: none
    height: 1px
  .ivu-btn
    margin-left: 20px
.transfer
  margin-bottom: 30px

.group-transfer
  margin-bottom: 30px
  padding-left: 2rem
  :deep(.ivu-transfer-list)
    width: 500px
.list-item
  display: flex
  justify-content: space-between
  padding: 14px 20px
  margin-bottom: 14px
  background-color: #f2f2f2
.ivu-icon-close-circled
  line-height: 20px
  color: #c3c2c2
  cursor: pointer
  &:hover
    font-size: 20px
.add
  margin-bottom: 20px
</style>

<style lang="stylus">
.ivu-picker-panel-content .ivu-picker-panel-content .ivu-time-picker-cells-with-seconds .ivu-time-picker-cells-list
  width 72px
</style>
