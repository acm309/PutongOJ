<script>
import { mapActions, mapState } from 'pinia'
import only from 'only'
import { useUserStore } from '@/store/modules/user'
import { useGroupStore } from '@/store/modules/group'

export default {
  data: () => ({
    ind: 0,
    targetKeys: [],
    listStyle: {
      width: '350px',
      height: '400px',
    },
    userList: [],
    operation: 'search',
  }),
  computed: {
    ...mapState(useGroupStore, [ 'group' ]),
    ...mapState(useGroupStore, { groupList: 'list' }),
    ...mapState(useUserStore, [ 'user' ]),
    ...mapState(useUserStore, {
      userSum: 'list',
    }),
    transData () {
      return this.userSum.map((item, index) => ({
        key: `${index}`,
        label: `${item.uid} | ${item.nick}`,
      }))
    },
  },
  created () {
    this.fetchGroup()
  },
  /**
   * onBeforeUnmount is called when there is no active component instance to be
   * associated with. Lifecycle injection APIs can only be used during execution of setup().
   * If you are using async setup(), make sure to register lifecycle hooks before the first await statement.
   */
  beforeUnmount () {
    this.clearSavedGroups()
    this.clearSavedUsers()
  },
  methods: {
    ...mapActions(useGroupStore, [ 'find', 'findOne', 'update', 'create', 'clearSavedGroups' ]),
    ...mapActions(useGroupStore, { remove: 'delete' }),
    ...mapActions(useUserStore, [ 'clearSavedUsers' ]),
    async fetchGroup () {
      this.$Spin.show()
      await useUserStore().find()
      await this.find()
      this.userSum.forEach((item) => {
        this.userList.push(item.uid)
      })
      this.$Spin.hide()
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
    async manageGroup (name) {
      if (this.groupList.length > 0) {
        this.group.gid = this.groupList[this.ind].gid
        this.group.title = this.groupList[this.ind].title
      }
      this.operation = name
      if (name === 'search') {
        this.$Spin.showLoading()
        this.targetKeys = []
        try {
          await this.findOne({ gid: this.group.gid })
          this.group.list.forEach((item) => {
            this.targetKeys.push(`${this.userList.indexOf(item)}`)
          })
        } finally {
          this.$Spin.hide()
        }
      } else if (name === 'create') {
        this.group.gid = ''
        this.group.title = ''
        this.group.list = []
        this.targetKeys = []
      } else if (name === 'delete') {
        if (!this.group || !this.group.gid) {
          this.$Message.info('未选择要删除的Group!')
        } else {
          this.$Modal.confirm({
            title: '提示',
            content: `<p>此操作将永久删除Group--${this.group.title}, 是否继续?</p>`,
            onOk: async () => {
              this.$Spin.showLoading()
              try {
                await this.remove({ gid: this.group.gid })
                this.$Message.success(`成功删除 ${this.group.title}！`)
              } finally {
                this.$Spin.hide()
              }
            },
            onCancel: () => {
              this.$Message.info('已取消删除！')
            },
          })
        }
      }
    },
    async saveGroup () {
      const user = this.targetKeys.map(item => this.userList[+item])
      const group = Object.assign(
        only(this.group, 'gid title'),
        { list: user },
      )
      if (this.group.gid !== '') {
        this.$Spin.showLoading()
        try {
          await this.update(group)
          this.$Message.success('更新当前用户组成功！')
        } finally {
          this.$Spin.hide()
        }
      } else {
        this.$Spin.showLoading()
        try {
          await this.create(group)
          this.$Message.success('新建当前用户组成功！')
        } finally {
          this.$Spin.hide()
        }
      }
    },
  },
}
</script>

<template>
  <div>
    <h1>管理用户组</h1>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Group
      </Col>
      <Col :span="4">
        <Select v-model="ind" filterable>
          <Option v-for="(item, index) in groupList" :key="item.gid" :value="index">
            {{ item.title }}
          </Option>
        </Select>
      </Col>
      <Col :offset="1" :span="2">
        <Dropdown @on-click="manageGroup">
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
        <Input v-model="group.title" />
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
    <Button type="primary" class="submit" @click="saveGroup">
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
