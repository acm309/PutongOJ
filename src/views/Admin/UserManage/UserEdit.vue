<script>
import { mapState } from 'pinia'
import { purify } from '@/util/helper'
import { useUserStore } from '@/store/modules/user'

export default {
  data: () => ({
    uid: '',
    newPwd: '',
    checkPwd: '',
  }),
  computed: {
    ...mapState(useUserStore, [ 'user' ]),
  },
  created () {
  },
  methods: {
    findUser () {
      useUserStore().findOne({ uid: this.uid })
    },
    saveUser () {
      if (this.newPwd === this.checkPwd) {
        const user = purify(Object.assign(
          this.user,
          { newPwd: this.newPwd },
        ))
        useUserStore().update(user).then(() => {
          this.$Message.success('修改成功！')
        })
      } else {
        this.$Message.info('两次密码不一致，请重新输入！')
      }
    },
  },
}
</script>

<template>
  <div>
    <h1>修改用户信息</h1>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Username
      </Col>
      <Col :span="4">
        <Input v-model="uid" />
      </Col>
      <Col :offset="1" :span="2">
        <Button type="primary" @click="findUser">
          Search
        </Button>
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Nick
      </Col>
      <Col :span="21">
        <Input v-model="user.nick" />
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Motto
      </Col>
      <Col :span="21">
        <Input v-model="user.motto" />
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        School
      </Col>
      <Col :span="21">
        <Input v-model="user.school" />
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Password
      </Col>
      <Col :span="21">
        <Input v-model="newPwd" type="password" placeholder="Leave it blank if it is not changed" />
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        CheckPwd
      </Col>
      <Col :span="21">
        <Input v-model="checkPwd" type="password" placeholder="Leave it blank if it is not changed" />
      </Col>
    </Row>
    <Button type="primary" class="submit" @click="saveUser">
      Submit
    </Button>
  </div>
</template>

<style lang="stylus" scoped>
.ivu-col-offset-1
  margin-left: 1%
</style>
