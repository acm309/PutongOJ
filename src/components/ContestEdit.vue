<script>
import draggable from 'vuedraggable'
import only from 'only'
import { mapActions, mapState } from 'pinia'
import { useUserStore } from '@/store/modules/user'
import { useProblemStore } from '@/store/modules/problem'
import { useRootStore } from '@/store'
import { useContestStore } from '@/store/modules/contest'

export default {
  components: {
    Draggable: draggable,
  },
  props: [ 'contest', 'overview' ],
  data () {
    return {
      jobs: {},
      options: [
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
      ],
      pid: '',
      targetKeys: [],
      listStyle: {
        width: '400px',
        height: '500px',
      },
      userList: [],
    }
  },
  computed: {
    ...mapState(useRootStore, [ 'encrypt' ]),
    ...mapState(useUserStore, [ 'list' ]),
    transData () {
      return this.list.map((item, index) => ({
        key: `${index}`,
        label: item.uid,
        disabled: false,
      }))
    },
  },
  created () {
    // 这里必须保证此时 overview 是存在的
    // 如果用户没有点过 overview tab 时，就会出现 overview 不存在的情况
    if (this.$route.params.cid) {
      let p = Promise.resolve()
      if (this.overview.length === 0) {
        p = this.findOne(only(this.$route.params, 'cid'))
      }
      p.then(() => {
        this.overview.forEach((item) => {
          // https://vuejs.org/2016/02/06/common-gotchas/
          this.$set(this.jobs, item.pid, item.title)
        })
      })
    }
    useUserStore().find().then(() => {
      this.userList = this.list.map(item => item.uid)
      if (+this.contest.encrypt === this.encrypt.Private) {
        const arg = this.contest.argument.split('\r\n')
        this.targetKeys = arg.map(item => `${this.userList.indexOf(item)}`)
      }
    })
  },
  methods: {
    ...mapActions(useProblemStore, {
      findOneProblem: 'findOne',
    }),
    ...mapActions(useContestStore, [ 'findOne' ]),
    async add () {
      const { problem } = await this.findOneProblem(only(this, 'pid'))
      // eslint-disable-next-line vue/no-mutating-props
      this.contest.list.push(problem.pid)
      this.$set(this.jobs, problem.pid, problem.title)
      this.pid = ''
    },
    removeJob (index) {
      // eslint-disable-next-line vue/no-mutating-props
      this.contest.list.splice(index, 1)
    },
    format (item) {
      return item.label
    },
    filterMethod (data, query) {
      return data.label.includes(query)
    },
    handleChange (newTargetKeys) {
      this.targetKeys = newTargetKeys
    },
    saveUser () {
      const user = this.targetKeys.map(item => this.userList[+item])
      const res = user.join('\r\n')
      // eslint-disable-next-line vue/no-mutating-props
      this.contest.argument = res
      this.$Message.success('保存当前用户组成功！')
    },
    changeTime (name, time) {
      if (name === 'start') {
        // eslint-disable-next-line vue/no-mutating-props
        this.contest.start = new Date(time).getTime()
      } else {
        // eslint-disable-next-line vue/no-mutating-props
        this.contest.end = new Date(time).getTime()
      }
    },
  },
}
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
        <Draggable v-model="contest.list">
          <transition-group name="list">
            <div v-for="(item, index) in contest.list" :key="index" class="list-item">
              <div>{{ item }} -- {{ jobs[item] }}</div>
              <Icon type="close-circled" @click="removeJob(index)" />
            </div>
          </transition-group>
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
