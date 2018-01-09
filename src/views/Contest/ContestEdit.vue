<template lang="html">
  <div class="conadd-wrap" v-if="contest">
    <!-- <pre>{{ jobs }} </pre> -->
    <!-- 这个注释故意留着，有时候偶用于调试蛮方便的 -->
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
      <Col :span="21">
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
import isEmpty from 'lodash.isempty'
import only from 'only'
import api from '@/api'
import { mapGetters } from 'vuex'

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
      pid: ''
    }
  },
  computed: {
    ...mapGetters('contest', ['contest', 'overview'])
  },
  created () {
    // 这里必须保证此时 overview 是存在的
    // 如果用户没有点过 overview tab 时，就会出现 overview 不存在的情况
    let p = Promise.resolve()
    if (isEmpty(this.overview)) {
      p = this.$store.dispatch('contest/findOne', only(this.$route.params, 'cid'))
    }
    p.then(() => this.$store.dispatch('contest/find', only(this.$route.params, 'cid')))
      .then(() => {
        this.overview.forEach((item) => {
          // https://vuejs.org/2016/02/06/common-gotchas/
          this.$set(this.jobs, item.pid, item.title)
        })
      })
  },
  methods: {
    add () {
      this.$store.dispatch('problem/findOne', only(this, 'pid'))
        .then((data) => {
          this.contest.list.push(data.pid)
          this.$set(this.jobs, item.pid, item.title)
          this.pid = ''
        })
    },
    submit () {
      api.contest.update(this.contest).then(({ data }) => {
        this.$Message.success('提交成功！')
        this.$router.push({name: 'contestOverview', params: only(data, 'cid')})
      })
    },
    removeJob (index) {
      this.contest.list.splice(index, 1)
    }
  },
  components: {
    draggable
  },
  beforeDestroy () {
    this.$store.dispatch('contest/findOne', only(this.$route.params, 'cid'))
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

<docs>
  这里，所有的更改都到了 store 里的 contest 上，这个方法并不一定最佳实践。
  一个可能的影响是:
    如果用户，在表单上修改了比赛的开始时间，比如从 1 月 1 日跳到 2 月 1 日，但是他没点 Submit，也就是说这个数据没有写到数据库，但是如果此时 前端的 contest 已经变了，你可以看到上方的进度条已经变了。如果，此时，用户（没有点 Submit）就点了去看排行榜之类的，那么他看到的都是基于开始时间是 2 月 1 日的。
  因此，这个时候用户看到的是有问题的！
  为了，解决这个问题，我在这里，beforeDestroy 处，再次请求了一次比赛。这样，不管用户最终有没有提交修改后的比赛表单，都能保持前端数据与数据库的保持同步。
</docs>
