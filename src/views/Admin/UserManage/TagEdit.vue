<script>
import only from 'only'
import { mapActions, mapState } from 'pinia'
import { useProblemStore } from '@/store/modules/problem'
import { useTagStore } from '@/store/modules/tag'

export default {
  data: () => ({
    ind: 0,
    targetKeys: [],
    listStyle: {
      width: '350px',
      height: '400px',
    },
    problemList: [],
    operation: 'search',
    isNew: false,
  }),
  computed: {
    ...mapState(useProblemStore, {
      problemSum: 'list',
    }),
    ...mapState(useTagStore, {
      tagList: 'list',
      tag: 'tag',
    }),
    transData () {
      return this.problemSum.map((item, index) => ({
        key: `${index}`,
        label: `${item.pid} | ${item.title}`,
      }))
    },
  },
  created () {
    this.fetchTag()
  },
  beforeUnmount () {
    this.clearSavedProblems()
    this.clearSavedTags()
  },
  methods: {
    ...mapActions(useProblemStore, {
      findProblems: 'find',
    }),
    ...mapActions(useProblemStore, [ 'clearSavedProblems' ]),
    ...mapActions(useTagStore, [ 'find', 'findOne', 'update', 'create', 'clearSavedTags' ]),
    ...mapActions(useTagStore, { remove: 'delete' }),
    async fetchTag () {
      this.$Spin.show()
      const opt = { page: -1 }
      await this.findProblems(opt)
      await this.find()
      this.$Spin.hide()
      this.problemSum.forEach((item) => {
        this.problemList.push(item.pid)
      })
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
    async manageTag (name) {
      if (this.tagList.length > 0) {
        this.tag.tid = this.tagList[this.ind].tid
      }
      this.operation = name
      if (name === 'search') {
        this.$Spin.showLoading()
        this.targetKeys = []
        this.isNew = false
        try {
          await this.findOne({ tid: this.tag.tid })
          this.tag.list.forEach((item) => {
            this.targetKeys.push(`${this.problemList.indexOf(item)}`)
          })
        } finally {
          this.$Spin.hide()
        }
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
              this.remove({ tid: this.tag.tid }).then(() => {
                this.$Spin.hide()
                this.$Message.success(`成功删除 ${this.tag.tid}！`)
              }).catch(() => {
                this.$Spin.hide()
              })
            },
            onCancel: () => {
              this.$Message.info('已取消删除！')
            },
          })
        }
      }
    },
    saveTag () {
      const problems = this.targetKeys.map(item => this.problemList[+item])
      const tag = Object.assign(
        only(this.tag, 'tid'),
        { list: problems },
      )
      if (!this.isNew) {
        this.$Spin.showLoading()
        this.update(tag).then(() => {
          this.$Spin.hide()
          this.$Message.success('更新当前标签组成功！')
        }).catch(() => {
          this.$Spin.hide()
        })
      } else {
        this.$Spin.showLoading()
        this.create(tag).then(() => {
          this.find()
          this.$Spin.hide()
          this.$Message.success('新建当前标签组成功！')
        }).catch(() => {
          this.$Spin.hide()
        })
      }
    },
  },
}
</script>

<template>
  <div>
    <h1>管理标签组</h1>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Tag
      </Col>
      <Col :span="4">
        <Select v-model="ind" filterable>
          <Option v-for="(item, index) in tagList" :key="item.tid" :value="index">
            {{ item.tid }}
          </Option>
        </Select>
      </Col>
      <Col :offset="1" :span="2">
        <Dropdown @on-click="manageTag">
          <Button type="primary">
            Manage
            <Icon type="ios-arrow-down" />
          </Button>
          <template #list>
            <DropdownMenu>
              <DropdownItem name="search">
                Search
              </DropdownItem>
              <DropdownItem name="create">
                Create
              </DropdownItem>
              <DropdownItem name="delete">
                Delete
              </DropdownItem>
            </DropdownMenu>
          </template>
        </Dropdown>
      </Col>
      <Col span="2">
        <Tag>
          {{ operation }}
        </Tag>
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Title
      </Col>
      <Col :span="4">
        <Input v-model="tag.tid" />
      </Col>
    </Row>
    <Transfer
      :data="transData"
      :target-keys="targetKeys"
      :render-format="format"
      :list-style="listStyle"
      :operations="['To left', 'To right']"
      filterable
      :filter-method="filterMethod"
      class="tranfer"
      @on-change="handleChange"
    />
    <Button type="primary" class="submit" @click="saveTag">
      Submit
    </Button>
  </div>
</template>

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
