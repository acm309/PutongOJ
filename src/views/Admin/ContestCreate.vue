<template lang="html">
  <div>
    <!-- <pre>{{ jobs }} </pre> -->
    <!-- 这个注释故意留着，有时候偶用于调试蛮方便的 -->
    <h1>注意事项</h1>
    <br>
    <Steps :current="5" :style="{ color: 'black'}">
      <Step title="难度区分" content="正常情况下要有一两道几乎所有人能做出来的题目" status="process"></Step>
      <Step title="题目正确性" content="不要拿未测试的题目进入比赛" icon="ios-star" status="process"></Step>
    </Steps>
    <br>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">Title</Col>
      <Col :span="21">
        <Input v-model="contest.title"></Input>
      </Col>
    </Row>
    <Row  type="flex" justify="start">
      <Col :span="2" class="label">Start Time</Col>
      <Col :span="8">
        <DatePicker
          v-model="contest.start"
          type="datetime"
          placeholder="选择日期时间">
        </DatePicker>
      </Col>
    </Row>
    <Row  type="flex" justify="start">
      <Col :span="2" class="label">End Time</Col>
      <Col :span="8">
        <DatePicker
          v-model="contest.end"
          type="datetime"
          placeholder="选择日期时间">
        </DatePicker>
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">Type</Col>
      <Col :span="4">
        <Select v-model="contest.encrypt" placeholder="请选择">
          <Option
            v-for="item in options"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </Option>
        </Select>
      </Col>
    </Row>
    <Row v-if="contest.encrypt === 3">
      <Col :span="23">
        <Input v-model="contest.argument"></Input>
      </Col>
    </Row>
    <Row>
      <Col :span="23"><hr></Col>
    </Row>
    <Row>
      <Col :span="23">
        <draggable v-model="contest.list">
          <transition-group name="list">
            <div v-for="(item, index) in contest.list" :key="index" class="list-item">
              <div>{{ item }} -- {{ jobs[item] }}</div>
              <Icon type="close-circled" @click.native="removeJob(index)"></Icon>
            </div>
          </transition-group>
        </draggable>
      </Col>
    </Row>
    <Row>
      <Col :span="21" class="add">
        <Input v-model="pid" placeholder="Add a pid" @keyup.enter.native="add"></Input>
      </Col>
      <Col :span="2">
        <Button type="primary" @click="add">Add</Button>
      </Col>
    </Row>
    <Row>
      <Col :span="23"><hr></Col>
    </Row>
    <Button type="primary" @click="submit">Submit</Button>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import only from 'only'
import { mapActions } from 'vuex'

export default {
  data () {
    return {
      jobs: {},
      options: [
        {
          value: 1,
          label: 'Public'
        },
        {
          value: 2,
          label: 'Private'
        },
        {
          value: 3,
          label: 'Password'
        }
      ],
      pid: '',
      contest: {
        title: '',
        start: '',
        end: '',
        list: [],
        encrypt: ''
      }
    }
  },
  methods: {
    ...mapActions('contest', [ 'create' ]),
    add () {
      this.$store.dispatch('problem/findOne', only(this, 'pid'))
        .then((data) => {
          this.contest.list.push(data.pid)
          this.$set(this.jobs, data.pid, data.title)
          this.pid = ''
        })
    },
    submit () {
      if (!this.contest.title) {
        this.$Message.error('Title can not be empty')
      } else if (!this.contest.start || !this.contest.end) {
        this.$Message.error('Time can not be empty')
      } else {
        this
          .create(this.contest)
          .then((cid) => {
            this.$Message.success(`Contest "${this.contest.title}" has been created!`)
            this.$router.push({ name: 'contestOverview', params: { cid } })
          })
      }
    },
    removeJob (index) {
      this.contest.list.splice(index, 1)
    }
  },
  components: {
    draggable
  }
}
</script>

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
