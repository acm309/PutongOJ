<template lang="html">
  <div>
    <h1>修改用户信息</h1>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">Uid</Col>
      <Col :span="4">
        <Input v-model="uid"></Input>
      </Col>
      <Col :offset="1" :span="2">
        <Button type="primary" @click="findUser">Search</Button>
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">Nick</Col>
      <Col :span="21">
        <Input v-model="user.nick"></Input>
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">Motto</Col>
      <Col :span="21">
        <Input v-model="user.motto"></Input>
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">School</Col>
      <Col :span="21">
        <Input v-model="user.school"></Input>
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">Password</Col>
      <Col :span="21">
        <Input v-model="newPwd" type="password" placeholder="Leave it blank if it is not changed"></Input>
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">CheckPwd</Col>
      <Col :span="21">
        <Input v-model="checkPwd" type="password" placeholder="Leave it blank if it is not changed"></Input>
      </Col>
    </Row>
    <Button type="primary" @click="saveUser" class="user-button">Submit</Button>
    <h1>管理用户组</h1>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">Group</Col>
      <Col :span="4">
        <Select v-model="group.gid" filterable>
          <Option v-for="item in groupList" :value="item.gid" :key="item.gid">{{ item.title }}</Option>
        </Select>
      </Col>
      <Col :offset="1" :span="2">
        <Dropdown @on-click="manageGroup">
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
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">Title</Col>
      <Col :span="4">
        <Input v-model="group.title"></Input>
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
    <Button type="primary" @click="saveGroup">Submit</Button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { purify } from '@/util/helper'
import only from 'only'

export default {
  data: () => ({
    uid: '',
    newPwd: '',
    checkPwd: '',
    gid: '',
    targetKeys: [],
    listStyle: {
      width: '350px',
      height: '400px'
    },
    userList: []
  }),
  computed: {
    ...mapGetters({
      user: 'user/user',
      userSum: 'user/list',
      groupList: 'group/list',
      group: 'group/group'
    }),
    transData () {
      let data = []
      this.userSum.forEach((item, index) => {
        data.push({
          key: index + '',
          label: item.uid,
          disabled: false
        })
      })
      return data
    }
  },
  created () {
    this.fetchGroup()
  },
  methods: {
    findUser () {
      this.$store.dispatch('user/findOne', { uid: this.uid })
    },
    saveUser () {
      if (this.newPwd === this.checkPwd) {
        const user = purify(Object.assign(
          this.user,
          { newPwd: this.newPwd }
        ))
        this.$store.dispatch('user/update', user).then(() => {
          this.$Message.success('修改成功！')
        })
      } else {
        this.$Message.info('两次密码不一致，请重新输入！')
      }
    },
    fetchGroup () {
      this.$store.dispatch('user/find')
        .then(() => {
          this.$store.dispatch('group/find')
        })
        .then(() => {
          this.userSum.forEach((item) => {
            this.userList.push(item.uid)
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
    manageGroup (name) {
      if (name === 'search') {
        this.targetKeys = []
        this.$store.dispatch('group/findOne', { gid: this.group.gid }).then(() => {
          this.group.list.forEach((item) => {
            this.targetKeys.push(this.userList.indexOf(item) + '')
          })
        })
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
            onOk: () => {
              this.$store.dispatch('group/delete', { gid: this.group.gid }).then(() => {
                this.$Message.success(`成功删除 ${this.group.title}！`)
              })
            },
            onCancel: () => {
              this.$Message.info('已取消删除！')
            }
          })
        }
      }
    },
    saveGroup () {
      let user = []
      this.targetKeys.forEach((item) => {
        user.push(this.userList[+item])
      })
      const group = Object.assign(
        only(this.group, 'gid title'),
        { list: user }
      )
      if (this.group.gid !== '') {
        this.$store.dispatch('group/update', group).then(() => {
          this.$Message.success('更新当前用户组成功！')
        })
      } else {
        this.$store.dispatch('group/create', group).then(() => {
          this.$Message.success('新建当前用户组成功！')
        })
      }
      this.$store.dispatch('group/find')
    }
  }
}
</script>

<style lang="stylus" scoped>
h1
  margin-bottom: 20px
.ivu-row-flex
  margin-bottom: 10px
.user-button
  margin-bottom: 20px
.label
  line-height: 32px
.ivu-col-offset-1
  margin-left: 1%
.tranfer
  margin-top: 20px
  margin-bottom: 20px
</style>
