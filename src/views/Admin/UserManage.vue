<template lang="html">
  <div>
    <h1>修改用户信息</h1>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">Uid</Col>
      <Col :span="4">
        <Input v-model="uid"></Input>
      </Col>
      <Col :offset="1" :span="2">
        <Button type="primary" @click="search">Search</Button>
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
    <Button type="primary" @click="submit" class="user-button">Submit</Button>
    <h1>管理用户组</h1>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">Group</Col>
      <Col :span="4">
        <Select v-model="gid" filterable>
          <Option v-for="item in list" :value="item.gid" :key="item.gid">{{ item.title }}</Option>
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
      <div :style="{float: 'right', margin: '5px'}">
        <Button type="ghost" size="small" @click="saveUser">Save</Button>
      </div>
    </Transfer>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { purify } from '@/util/helper'

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
    }
  }),
  computed: {
    ...mapGetters({
      user: 'user/user',
      list: 'group/list'
    }),
    transData () {
      let data = []
      this.list.forEach((item, index) => {
        data.push({
          key: index + '',
          label: item.gid,
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
    search () {
      this.$store.dispatch('user/findOne', { uid: this.uid })
    },
    submit () {
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
      this.$store.dispatch('group/find')
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
    saveUser () {
      let user = []
      this.targetKeys.forEach((item) => {
        user.push(this.list[+item])
      })
      // TODO
      this.$Message.success('保存当前用户组成功！')
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
</style>
