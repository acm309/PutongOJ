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
import api from '@/api'

const props = defineProps([ 'contest', 'overview' ])
const { t } = useI18n()
const rootStore = useRootStore()
const problemStore = useProblemStore()
const route = useRoute()

const { encrypt } = $(storeToRefs(rootStore))
const { findOne: findOneProblem } = problemStore

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
const pwd = $ref('')

async function add () {
  const { problem } = await findOneProblem({ pid })

  contest.list.push(problem.pid)
  jobs[item.pid] = item.title
  pid = ''
}
function removeJob (index) {
  contest.list.splice(index, 1)
}

onBeforeMount(async () => {
  if (route.params.cid) {
    if (overview.length === 0) {
      await findOne(only(route.params, 'cid'))
    }
    overview.forEach(item => jobs[item.pid] = item.title)
  }
})

// User search
const Spin = inject('$Spin')
let source = $ref([])
async function search (val) {
  try {
    Spin.show()
    const { data } = await api.user.find({ type: 'uid', content: val })
    source = data.list.map(item => ({
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

watch(() => contest.encrypt, async (val) => {
  if (val === encrypt.Password) {
    contest.argument = pwd
  } else if (val === encrypt.Private) {
    contest.argument = result.join('\r\n')
  }
})
watch($$(pwd), () => contest.argument = pwd)
watch($$(result), () => contest.argument = result.join('\r\n'))
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
          :model-value="new Date(contest?.start || new Date().getTime())"
          type="datetime"
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
          :model-value="new Date(contest?.end || new Date().getTime() + 60 * 1000 * 60)"
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
