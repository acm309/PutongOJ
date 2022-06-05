<script setup>
import Draggable from 'vuedraggable'
import only from 'only'
import { storeToRefs } from 'pinia'
import { onBeforeMount, toRefs } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { useProblemStore } from '@/store/modules/problem'
import { useRootStore } from '@/store'

const props = defineProps([ 'contest', 'overview' ])
const rootStore = useRootStore()
const userStore = useUserStore()
const problemStore = useProblemStore()
const route = useRoute()

const { encrypt } = $(storeToRefs(rootStore))
const { list } = $(storeToRefs(userStore))
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
let targetKeys = $ref([])
const listStyle = {
  width: '400px',
  height: '500px',
}
let userList = $ref([])

const transData = $computed(() => list.map((item, index) => ({
  key: `${index}`,
  label: item.uid,
  disabled: false,
})))

async function add () {
  const { problem } = await findOneProblem({ pid })

  contest.list.push(problem.pid)
  jobs[item.pid] = item.title
  pid = ''
}
function removeJob (index) {
  contest.list.splice(index, 1)
}
function format (item) {
  return item.label
}
function filterMethod (data, query) {
  return data.label.includes(query)
}
function handleChange (newTargetKeys) {
  targetKeys = newTargetKeys
}
function saveUser () {
  const user = targetKeys.map(item => userList[+item])
  const res = user.join('\r\n')

  contest.argument = res
  $Message.success('保存当前用户组成功！')
}
function changeTime (name, time) {
  if (name === 'start') {
    contest.start = new Date(time).getTime()
  } else {
    contest.end = new Date(time).getTime()
  }
}

onBeforeMount(async () => {
  if (route.params.cid) {
    if (overview.length === 0) {
      await findOne(only(route.params, 'cid'))
    }
    overview.forEach(item => jobs[item.pid] = item.title)
  }
  await useUserStore().find()
  userList = list.map(item => item.uid)
  if (+contest.encrypt === encrypt.Private) {
    const arg = contest.argument.split('\r\n')
    targetKeys = arg.map(item => `${this.userList.indexOf(item)}`)
  }
})
</script>

<template>
  <div>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Title
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
          :model-value="new Date(contest?.start || 0)"
          type="datetime"
          placeholder="选择日期时间"
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
          :model-value="new Date(contest?.end || 0)"
          placeholder="选择日期时间"
          @on-change="(time) => changeTime('end', time)"
        />
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Type
      </Col>
      <Col :span="4">
        <!-- eslint-disable-next-line vue/no-mutating-props -->
        <Select v-model="contest.encrypt" placeholder="请选择">
          <Option
            v-for="item in options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </Select>
      </Col>
    </Row>
    <Row v-if="contest.encrypt === encrypt.Private" class="transfer">
      <Transfer
        :data="transData"
        :target-keys="targetKeys"
        :render-format="format"
        :list-style="listStyle"
        :operations="[ 'To left', 'To right' ]"
        filterable
        :filter-method="filterMethod"
        @on-change="handleChange"
      >
        <div :style="{ float: 'right', margin: '5px' }">
          <Button type="ghost" size="small" @click="saveUser">
            Save
          </Button>
        </div>
      </Transfer>
    </Row>
    <Row v-if="contest.encrypt === encrypt.Password">
      <Col :span="23">
        <!-- eslint-disable-next-line vue/no-mutating-props -->
        <Input v-model="contest.argument" />
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
      <Col :span="2">
        <Button type="primary" @click="add">
          Add
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
