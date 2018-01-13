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
    <Button type="primary" @click="submit">Submit</Button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { purify } from '@/util/helper'

export default {
  data: () => ({
    uid: '',
    newPwd: '',
    checkPwd: ''
  }),
  computed: {
    ...mapGetters({
      user: 'user/user'
    })
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
    }
  }
}
</script>

<style lang="stylus" scoped>
h1
  margin-bottom: 20px
.ivu-row-flex
  margin-bottom: 10px
</style>
