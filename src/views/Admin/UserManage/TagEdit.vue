<template>
  <div>
    <h1>管理标签组</h1>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">Tag</Col>
      <Col :span="4">
        <Select v-model="ind" filterable>
          <Option v-for="(item, index) in tagList" :value="index" :key="item.tid">{{ item.tid }}</Option>
        </Select>
      </Col>
      <Col :offset="1" :span="2">
        <Button type="primary" @click="search">Search</Button>
      </Col>
    </Row>
    <Transfer
      :data="transData"
      :target-keys="targetKeys"
      :render-format="format"
      :list-style="listStyle"
      :operations="['To left','To right']"
      filterable
      :filter-method="filterMethod"
      @on-change="handleChange"
      class="tranfer">
    </Transfer>
    <Button type="primary" @click="save" class="submit">Submit</Button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import only from 'only'

export default {
  data: () => ({
    ind: 0,
    targetKeys: [],
    listStyle: {
      width: '350px',
      height: '400px'
    },
    problemList: []
  }),
  computed: {
    ...mapGetters({
      tagList: 'tag/list',
      tag: 'tag/tag',
      problemSum: 'problem/list'
    }),
    transData () {
      return this.problemSum.map((item, index) => ({
        key: index + '',
        label: item.pid + ' | ' + item.title
      }))
    }
  },
  created () {
    this.fetchTag()
  },
  methods: {
    fetchTag () {
      this.$Spin.showLoading()
      const opt = { page: -1 }
      this.$store.dispatch('problem/find', opt)
        .then(() => {
          this.$store.dispatch('tag/find')
        })
        .then(() => {
          this.$Spin.hide()
          this.problemSum.forEach((item) => {
            this.problemList.push(item.pid)
          })
        })
    },
    format (item) {
      return item.label
    },
    filterMethod (data, query) {
      return data.label.indexOf(query) > -1
    },
    handleChange (newTargetKeys) {
      this.targetKeys = newTargetKeys
    },
    search () {
      this.tag.tid = this.tagList[this.ind].tid
      this.$Spin.showLoading()
      this.targetKeys = []
      this.$store.dispatch('tag/findOne', { tid: this.tag.tid }).then(() => {
        this.tag.list.forEach((item) => {
          this.targetKeys.push(this.problemList.indexOf(item) + '')
        })
        this.$Spin.hide()
      })
    },
    save () {
      const problems = this.targetKeys.map((item) => this.problemList[+item])
      const tag = Object.assign(
        only(this.tag, 'tid'),
        { list: problems }
      )
      this.$Spin.showLoading()
      this.$store.dispatch('tag/update', tag).then(() => {
        this.$Spin.hide()
        this.$Message.success('更新当前标签组成功！')
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
.ivu-col-offset-1
  margin-left: 1%
.tranfer
  margin-top: 20px
  margin-bottom: 20px
</style>
