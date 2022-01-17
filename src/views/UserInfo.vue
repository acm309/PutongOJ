<template>
  <div class="user-wrap">
    <Row>
      <Col :span="6">
        <img src="../assets/logo.png" alt="">
        <h1 style="margin-bottom: 20px">{{ user.uid }}</h1>
        <Icon type="person"></Icon>&nbsp;&nbsp;{{ `Nick: ${user.nick}` }}
        <div class="group" v-if="group.length > 0">
          <Icon type="person-stalker"></Icon>&nbsp;&nbsp;{{ `Group: ${group}` }}
        </div>
        <div class="motto" v-if="user.motto">
          <Icon type="edit"></Icon>&nbsp;&nbsp;{{ `Motto: ${user.motto}` }}
        </div>
        <div v-if="user.mail">
          <Icon type="email"></Icon>&nbsp;&nbsp;{{ `Mail: ${user.mail}` }}
        </div>
        <div v-if="user.school">
          <Icon type="university"></Icon>&nbsp;&nbsp;{{ `School: ${user.school}` }}
        </div>
        <Row class="border" type="flex" justify="center">
          <Col :span="12">
            <h1>{{ user.solve }}</h1>
            <h4>Solved</h4>
          </Col>
          <Col :span="12">
            <h1>{{ user.submit }}</h1>
            <h4>Submit</h4>
          </Col>
        </Row>
        <Button style="margin-top: 20px" type="warning" long v-if="isAdmin && user.uid != 'admin' && canRemove"
          @click="del(user.uid)"
        >
          REMOVE THIS USER
        </Button>
      </Col>
      <Col :offset="1" :span="17">
        <Tabs v-model="display">
          <TabPane label="Overview" name="overview">
            <div class="solved">
              <div class="solved-name">Solved</div>
              <Button v-for="(item, index) in solved" :key="item" type="text">
                <router-link :to="{ name: 'problemInfo', params: { pid: item } }">{{ item }}</router-link>
              </Button>
            </div>
            <div class="unsolved">
              <div class="unsolved-name">Unolved</div>
              <Button v-for="item in unsolved" :key="item" type="text">
                <router-link :to="{ name: 'problemInfo', params: { pid: item } }">{{ item }}</router-link>
              </Button>
            </div>
          </TabPane>
          <TabPane label="Edit" name="edit" class="edit" v-if="profile && profile.uid === user.uid">
            <Row class="nick">
              <Col :span="2" class="label">Nick</Col>
              <Col :span="12">
                <Input v-model="user.nick"></Input>
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">Motto</Col>
              <Col :span="12">
                <Input v-model="user.motto"></Input>
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">School</Col>
              <Col :span="12">
                <Input v-model="user.school"></Input>
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">Mail</Col>
              <Col :span="12">
                <Input v-model="user.mail"></Input>
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">Password</Col>
              <Col :span="12">
                <Input v-model="newPwd" type="password" placeholder="Leave it blank if it is not changed"></Input>
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">CheckPwd</Col>
              <Col :span="12">
                <Input v-model="checkPwd" type="password" placeholder="Leave it blank if it is not changed"></Input>
              </Col>
            </Row>
            <Row class="submit">
              <Col :offset="6" :span="6">
                <Button type="primary" size="large" @click="submit">Submit</Button>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Col>
    </Row>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import { purify } from '@/util/helper'

export default {
  data: () => ({
    display: 'overview',
    newPwd: '',
    checkPwd: ''
  }),
  computed: {
    ...mapGetters({
      user: 'user/user',
      solved: 'user/solved',
      unsolved: 'user/unsolved',
      group: 'user/group',
      profile: 'session/profile',
      isAdmin: 'session/isAdmin',
      canRemove: 'session/canRemove'
    })
  },
  created () {
    this.fetch()
  },
  methods: {
    ...mapActions(['changeDomTitle']),
    fetch () {
      this.$store.dispatch('user/findOne', this.$route.params).then(() => {
        this.changeDomTitle({ title: this.user.uid })
      })
    },
    submit () {
      if (this.newPwd === this.checkPwd) {
        const user = purify(Object.assign(
          this.user,
          { newPwd: this.newPwd }
        ))
        user.mail = this.user.mail || ''
        this.$store.dispatch('user/update', user).then(() => {
          this.$Message.success('修改成功！')
          this.display = 'overview'
        })
      } else {
        this.$Message.info('两次密码不一致，请重新输入！')
      }
    },
    del (uid) {
      this.$Modal.confirm({
        title: '提示',
        content: `<p>此操作将永久删除用户 ${uid}, 是否继续?</p>`,
        onOk: () => {
          this.$store.dispatch('user/delete', { uid }).then(() => {
            this.$router.push({ name: 'home' })
            this.$Message.success(`成功删除 ${uid}！`)
          })
        },
        onCancel: () => {
          this.$Message.info('已取消删除！')
        }
      })
    }
  },
  watch: {
    '$route' (to, from) {
      if (to !== from) {
        this.fetch()
      }
    }
  }
}
</script>
<style lang="stylus">
.user-wrap
  text-align: left
  line-height: 30px
  img
    width: 60%
    margin: 0 20%
  .border
    margin-top: 20px
    padding: 10px 0
    border-top: 1px solid #dfe2e8
    border-bottom: 1px solid #dfe2e8
    h1, h4
      text-align: center
  .solved, .unsolved
    margin-bottom: 30px
  .ivu-btn-text
    margin-left: 10px
    padding: 0
    font-size: 14px
  a
    color: #B12CCC
  .image
    width: 100%
    display: block
  .motto // motto 可能非常长，以至于一页放不下
    word-wrap: break-word
  .edit
    .ivu-row
      margin-bottom: 14px
    .nick
      margin-top: 10px
    .submit
      margin-top: 30px
</style>
