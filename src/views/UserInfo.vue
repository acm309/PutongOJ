<script setup>
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { inject } from 'vue'
import { purify } from '@/util/helper'
import { useUserStore } from '@/store/modules/user'
import { useSessionStore } from '@/store/modules/session'
import { useRootStore } from '@/store'

const userStore = useUserStore()
const rootStore = useRootStore()
const sessionStore = useSessionStore()

const { findOne, update, 'delete': remove } = userStore
const { user, solved, unsolved, group } = $(storeToRefs(userStore))
const { isAdmin, profile, canRemove } = $(storeToRefs(sessionStore))

let display = $ref('overview')
const newPwd = $ref('')
const checkPwd = $ref('')

const route = useRoute()
const $Message = inject('$Message')
const $Modal = inject('$Modal')

async function fetch () {
  if (route.params.uid == null) return
  await findOne(route.params)
  rootStore.changeDomTitle({ title: user.uid })
}

async function submit () {
  if (newPwd === checkPwd) {
    const updatedUser = purify(Object.assign(
      user,
      { newPwd },
    ))
    updatedUser.mail = user.mail || ''
    update(user).then(() => {
      display = 'overview'
      $Message.success('修改成功！')
    })
  } else {
    $Message.info('两次密码不一致，请重新输入！')
  }
}

function del (uid) {
  $Modal.confirm({
    title: '提示',
    content: `<p>此操作将永久删除用户 ${uid}, 是否继续?</p>`,
    onOk: async () => {
      await remove({ uid })
      $router.push({ name: 'home' })
      $Message.success(`成功删除 ${uid}！`)
    },
    onCancel: () => {
      $Message.info('已取消删除！')
    },
  })
}

fetch()
</script>

<template>
  <div class="user-wrap">
    <Row>
      <Col :span="6">
        <img src="../assets/logo.png" alt="">
        <h1 style="margin-bottom: 20px">
          {{ user.uid }}
        </h1>
        <Icon type="person" />&nbsp;&nbsp;{{ `Nick: ${user.nick}` }}
        <div v-if="group.length > 0" class="group">
          <Icon type="person-stalker" />&nbsp;&nbsp;{{ `Group: ${group}` }}
        </div>
        <div v-if="user.motto" class="motto">
          <Icon type="edit" />&nbsp;&nbsp;{{ `Motto: ${user.motto}` }}
        </div>
        <div v-if="user.mail">
          <Icon type="email" />&nbsp;&nbsp;{{ `Mail: ${user.mail}` }}
        </div>
        <div v-if="user.school">
          <Icon type="university" />&nbsp;&nbsp;{{ `School: ${user.school}` }}
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
        <Button
          v-if="isAdmin && user.uid !== 'admin' && canRemove" style="margin-top: 20px" type="warning" long
          @click="del(user.uid)"
        >
          REMOVE THIS USER
        </Button>
      </Col>
      <Col :offset="1" :span="17">
        <Tabs v-model="display">
          <TabPane label="Overview" name="overview">
            <div class="solved">
              <div class="solved-name">
                Solved
              </div>
              <Button v-for="item in solved" :key="item" type="text">
                <router-link :to="{ name: 'problemInfo', params: { pid: item } }">
                  {{ item }}
                </router-link>
              </Button>
            </div>
            <div class="unsolved">
              <div class="unsolved-name">
                Unolved
              </div>
              <Button v-for="item in unsolved" :key="item" type="text">
                <router-link :to="{ name: 'problemInfo', params: { pid: item } }">
                  {{ item }}
                </router-link>
              </Button>
            </div>
          </TabPane>
          <TabPane v-if="profile && profile.uid === user.uid" label="Edit" name="edit" class="edit">
            <Row class="nick">
              <Col :span="2" class="label">
                Nick
              </Col>
              <Col :span="12">
                <Input v-model="user.nick" />
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">
                Motto
              </Col>
              <Col :span="12">
                <Input v-model="user.motto" />
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">
                School
              </Col>
              <Col :span="12">
                <Input v-model="user.school" />
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">
                Mail
              </Col>
              <Col :span="12">
                <Input v-model="user.mail" />
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">
                Password
              </Col>
              <Col :span="12">
                <Input v-model="newPwd" type="password" placeholder="Leave it blank if it is not changed" />
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">
                CheckPwd
              </Col>
              <Col :span="12">
                <Input v-model="checkPwd" type="password" placeholder="Leave it blank if it is not changed" />
              </Col>
            </Row>
            <Row class="submit">
              <Col :offset="6" :span="6">
                <Button type="primary" size="large" @click="submit">
                  Submit
                </Button>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Col>
    </Row>
  </div>
</template>

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
