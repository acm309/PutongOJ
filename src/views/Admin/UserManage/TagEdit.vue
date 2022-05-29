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
        <Dropdown @on-click="manageTag">
          <Button type="primary">
            Manage
            <Icon type="arrow-down-b"></Icon>
          </Button>
          <DropdownMenu slot="list">
            <DropdownItem name="search">Search</DropdownItem>
            <DropdownItem name="create">Create</DropdownItem>
            <DropdownItem name="delete">Delete</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </Col>
      <Col span="2">
        <Tag>
          {{ operation }}
        </Tag>
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">Title</Col>
      <Col :span="4">
        <Input v-model="tag.tid"></Input>
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
    <Button type="primary" @click="saveTag" class="submit">Submit</Button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import only from 'only'
import { useProblemStore } from '@/store/modules/problem'
import { mapActions, mapState } from 'pinia'

export default {
  data: () => ({
    ind: 0,
    targetKeys: [],
    listStyle: {
      width: '350px',
      height: '400px'
    },
    problemList: [],
    operation: 'search',
    isNew: false
  }),
  computed: {
    ...mapGetters({
      tagList: 'tag/list',
      tag: 'tag/tag'
    }),
    ...mapState(useProblemStore, {
      problemSum: 'list'
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
    ...mapActions(useProblemStore, {
      findProblems: 'find'
    }),
    fetchTag () {
      this.$Spin.showLoading()
      const opt = { page: -1 }
      this.findProblems(opt)
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
    manageTag (name) {
      if (this.tagList.length > 0) {
        this.tag.tid = this.tagList[this.ind].tid
      }
      this.operation = name
      if (name === 'search') {
        this.$Spin.showLoading()
        this.targetKeys = []
        this.isNew = false
        this.$store.dispatch('tag/findOne', { tid: this.tag.tid }).then(() => {
          this.tag.list.forEach((item) => {
            this.targetKeys.push(this.problemList.indexOf(item) + '')
          })
          this.$Spin.hide()
        }).catch(() => {
          this.$Spin.hide()
        })
      } else if (name === 'create') {
        this.tag.tid = ''
        this.tag.list = []
        this.targetKeys = []
        this.isNew = true
      } else if (name === 'delete') {
        if (!this.tag || !this.tag.tid) {
          this.$Message.info('未选择要删除的Tag!')
        } else {
          this.$Modal.confirm({
            title: '提示',
            content: `<p>此操作将永久删除Tag--${this.tag.tid}, 是否继续?</p>`,
            onOk: () => {
              this.$Spin.showLoading()
              this.$store.dispatch('tag/delete', { tid: this.tag.tid }).then(() => {
                this.$Spin.hide()
                this.$Message.success(`成功删除 ${this.tag.tid}！`)
              }).catch(() => {
                this.$Spin.hide()
              })
            },
            onCancel: () => {
              this.$Message.info('已取消删除！')
            }
          })
        }
      }
    },
    saveTag () {
      const problems = this.targetKeys.map((item) => this.problemList[+item])
      const tag = Object.assign(
        only(this.tag, 'tid'),
        { list: problems }
      )
      if (!this.isNew) {
        this.$Spin.showLoading()
        this.$store.dispatch('tag/update', tag).then(() => {
          this.$Spin.hide()
          this.$Message.success('更新当前标签组成功！')
        }).catch(() => {
          this.$Spin.hide()
        })
      } else {
        this.$Spin.showLoading()
        this.$store.dispatch('tag/create', tag).then(() => {
          this.$store.dispatch('tag/find')
          this.$Spin.hide()
          this.$Message.success('新建当前标签组成功！')
        }).catch(() => {
          this.$Spin.hide()
        })
      }
    }
  }
  // TODO: clear saved tags when leaving
}
</script>

<style lang="stylus" scoped>
.ivu-col-offset-1
  margin-left: 1%
.tranfer
  margin-top: 20px
  margin-bottom: 20px
.ivu-tag
  height: 28px
  line-height: 26px
</style>
