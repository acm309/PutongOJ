<template lang="html">
  <div class="conadd-wrap">
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
              <div>{{ item }} -- {{ jobs.get(item) }}</div>
              <Icon type="close-circled" @click.native="removeJob(index)"></Icon>
            </div>
          </transition-group>
        </draggable>
      </Col>
    </Row>
    <Row>
      <Col :span="21">
        <Input v-model="contest.problem" placeholder="Add a pid" @keyup.enter.native="add"></Input>
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
import api from '@/api'
import { mapGetters } from 'vuex'

export default {
  data () {
    return {
      jobs: new Map(),
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
      ]
    }
  },
  computed: {
    ...mapGetters('contest', {
      contest: 'contest',
      overview: 'overview'
    })
  },
  created () {
    this.$store.dispatch('contest/find', { cid: this.$route.params.cid })
      .then(() => {
        this.overview.forEach((item) => {
          this.jobs.set(item.pid, item.title)
        })
      })
  },
  methods: {
    add () {
      this.$store.dispatch('problem/getProblem', { pid: this.contest.problem })
        .then((data) => {
          this.contest.list.push(data.pid)
          this.jobs.set(data.pid, data.title)
        })
      this.contest.problem = ''
    },
    submit () {
      api.contest.update(this.contest).then(({ data }) => {
        if (data.success) {
          this.$message.success('提交成功！')
          this.$router.push({name: 'contestOverview', params: { cid: data.cid }})
        }
      })
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
.ivu-row
  margin-bottom: 14px
.ivu-col
  text-align: left
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
</style>
