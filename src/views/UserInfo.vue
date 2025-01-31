<script setup>
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { onProfileUpdate, onRouteParamUpdate, purify } from '@/util/helper'
import { useUserStore } from '@/store/modules/user'
import { useSessionStore } from '@/store/modules/session'
import { useRootStore } from '@/store'

const { t } = useI18n()
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
      $Message.success(t('oj.update_success'))
    })
  } else {
    $Message.info(t('oj.password_not_match'))
  }
}

function del (uid) {
  $Modal.confirm({
    okText: t('oj.ok'),
    cancelText: t('oj.cancel'),
    title: t('oj.warning'),
    content: `<p>${t('oj.will_remove_user_continue_or_not', { uid })}</p>`,
    onOk: async () => {
      await remove({ uid })
      $router.push({ name: 'home' })
      $Message.success(t('oj.remove_user_success', { uid }))
    },
    onCancel: () => {
      $Message.info(t('oj.cancel_remove'))
    },
  })
}

fetch()
onRouteParamUpdate(fetch)
onProfileUpdate(fetch)
</script>

<template>
  <div class="user-wrap">
    <Row>
      <Col :span="6">
        <img src="../assets/logo.png" alt="">
        <h1 style="margin-bottom: 20px">
          {{ user.uid }}
        </h1>
        <Icon type="person" />&nbsp;&nbsp;{{ `${t('oj.nick')}: ${user.nick}` }}
        <div v-if="group.length > 0" class="group">
          <Icon type="person-stalker" />&nbsp;&nbsp;{{ `${t('oj.group')}: ${group}` }}
        </div>
        <div v-if="user.motto" class="motto">
          <Icon type="edit" />&nbsp;&nbsp;{{ `${t('oj.motto')}: ${user.motto}` }}
        </div>
        <div v-if="user.mail">
          <Icon type="email" />&nbsp;&nbsp;{{ `${t('oj.mail')}: ${user.mail}` }}
        </div>
        <div v-if="user.school">
          <Icon type="university" />&nbsp;&nbsp;{{ `${t('oj.school')}: ${user.school}` }}
        </div>
        <Row class="border" type="flex" justify="center">
          <Col :span="12">
            <h1>{{ user.solve }}</h1>
            <h4>{{ t('oj.solved') }}</h4>
          </Col>
          <Col :span="12">
            <h1>{{ user.submit }}</h1>
            <h4>{{ t('oj.submit') }}</h4>
          </Col>
        </Row>
        <Button
          v-if="isAdmin && user.uid !== 'admin' && canRemove" style="margin-top: 20px" type="warning" long
          @click="del(user.uid)"
        >
          {{ t('oj.user_remove') }}
        </Button>
      </Col>
      <Col :offset="1" :span="17">
        <Tabs v-model="display">
          <TabPane :label="t('oj.overview')" name="overview">
            <div class="solved">
              <div class="solved-name">
                {{ t('oj.solved') }}
              </div>
              <Button v-for="item in solved" :key="item" type="text">
                <router-link :to="{ name: 'problemInfo', params: { pid: item } }">
                  {{ item }}
                </router-link>
              </Button>
            </div>
            <div class="unsolved">
              <div class="unsolved-name">
                {{ t('oj.unsolved') }}
              </div>
              <Button v-for="item in unsolved" :key="item" type="text">
                <router-link :to="{ name: 'problemInfo', params: { pid: item } }">
                  {{ item }}
                </router-link>
              </Button>
            </div>
          </TabPane>
          <TabPane
            v-if="profile && profile.uid === user.uid"
            :label="t('oj.edit')" name="edit" class="edit"
          >
            <Row class="nick">
              <Col :span="2" class="label">
                {{ t('oj.nick') }}
              </Col>
              <Col :span="12">
                <Input v-model="user.nick" />
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">
                {{ t('oj.motto') }}
              </Col>
              <Col :span="12">
                <Input v-model="user.motto" />
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">
                {{ t('oj.school') }}
              </Col>
              <Col :span="12">
                <Input v-model="user.school" />
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">
                {{ t('oj.mail') }}
              </Col>
              <Col :span="12">
                <Input v-model="user.mail" />
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">
                {{ t('oj.password') }}
              </Col>
              <Col :span="12">
                <Input
                  v-model="newPwd" type="password"
                  :placeholder="t('oj.leave_it_blank_if_no_change')"
                />
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">
                {{ t('oj.password_confirm') }}
              </Col>
              <Col :span="12">
                <Input
                  v-model="checkPwd" type="password"
                  :placeholder="t('oj.leave_it_blank_if_no_change')"
                />
              </Col>
            </Row>
            <Row class="submit">
              <Col :offset="6" :span="6">
                <Button type="primary" size="large" @click="submit">
                  {{ t('oj.submit') }}
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
  max-width: 1024px !important
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
