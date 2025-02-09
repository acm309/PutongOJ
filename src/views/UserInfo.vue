<script setup>
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { onProfileUpdate, onRouteParamUpdate, purify } from '@/util/helper'
import { useUserStore } from '@/store/modules/user'
import { useSessionStore } from '@/store/modules/session'
import { useGroupStore } from '@/store/modules/group'
import { useRootStore } from '@/store'

import only from 'only'
import pangu from 'pangu'

import { Tabs, TabPane, Icon, Button, Input, Divider, Space, Form, FormItem, RadioGroup, Radio, Spin } from 'view-ui-plus'

const { t } = useI18n()
const userStore = useUserStore()
const rootStore = useRootStore()
const sessionStore = useSessionStore()
const groupStore = useGroupStore()

const { judge, privilege } = $(storeToRefs(rootStore))
const { list: groups } = $(storeToRefs(groupStore))
const { findOne, update, 'delete': remove } = userStore
const { user, solved, unsolved, group } = $(storeToRefs(userStore))
const { isAdmin, profile, canRemove } = $(storeToRefs(sessionStore))

const route = useRoute()
const $Message = inject('$Message')
const $Modal = inject('$Modal')
const userForm = $ref(null)

let loading = $ref(false)
let display = $ref(route.query.view || 'overview')
let newPwd = $ref('')
let checkPwd = $ref('')

async function fetch() {
  loading = true
  if (route.params.uid == null) return
  await Promise.all([
    findOne(route.params),
    groupStore.find({ lean: 1 })
  ])
  rootStore.changeDomTitle({ title: user.uid })
  loading = false
}

const updateProfile = () =>
  userForm.validate(async valid => {
    if (!valid) return
    loading = true
    const updatedUser = only(user, 'uid nick motto mail school')
    if (canRemove) updatedUser.privilege = user.privilege
    const response = await update(updatedUser)
    if (!response.isAxiosError) {
      display = 'overview'
      $Message.success(t('oj.update_success'))
    }
    loading = false
  })

async function updatePassword() {
  if (!newPwd && !checkPwd) return
  if (newPwd !== checkPwd) {
    $Message.error(t('oj.password_not_match'))
    return
  }
  loading = true
  const response = await update({ uid: user.uid, newPwd: newPwd })
  if (!response.isAxiosError) {
    newPwd = ''
    checkPwd = ''
    $Message.success(t('oj.update_success'))
  }
  loading = false
}

const getGID = groupName => groups.find(item => item.title === groupName)?.gid

const nickname = $computed(() => user.nick || user.uid)
const username = $computed(() => user.nick && user.nick !== user.uid ? user.uid : '')

const editable = $computed(() => isAdmin || profile && profile.uid === user.uid)
const view = $computed(() => editable ? display : 'overview')

const ruleValidate = {
  uid: [{ required: true, trigger: 'blur' }],
  nick: [{ type: 'string', max: 20, trigger: 'change' }],
  motto: [{ type: 'string', max: 100, trigger: 'change' }],
  mail: [{ type: 'email', trigger: 'change' }],
  school: [{ type: 'string', max: 20, trigger: 'change' }]
}

const privilegeOptions = [
  { label: 'Banned', value: privilege.Banned, disabled: true },
  { label: 'User', value: privilege.PrimaryUser },
  { label: 'Teacher', value: privilege.Teacher },
  { label: 'Admin', value: privilege.Root }
]

fetch()
onRouteParamUpdate(fetch)
onProfileUpdate(fetch)
</script>

<template>
  <div :class="{ 'user-wrap': true, 'user-warp-edit': view === 'edit' }">
    <Tabs class="user-tabs" v-model="display" v-if="editable">
      <TabPane :label="t('oj.overview')" name="overview" />
      <TabPane :label="t('oj.edit')" name="edit" />
    </Tabs>
    <div class="user-tab user-overwiew" v-show="view === 'overview'">
      <div class="user-infobar">
        <img class="user-avatar" src="../assets/logo.jpg" alt="Avatar" />
        <div class="user-name">
          <div class="user-nickname">{{ nickname }}</div>
          <div class="user-username" v-if="username">{{ username }}</div>
        </div>
        <div class="user-motto" v-if="user.motto">{{ pangu.spacing(user.motto).trim() }}</div>
        <div class="user-info" v-if="user.mail || user.school">
          <div v-if="user.mail" class="user-mail">
            <Icon class="icon" type="md-mail" />{{ user.mail }}
          </div>
          <div v-if="user.school" class="user-school">
            <Icon class="icon" type="md-school" />{{ user.school }}
          </div>
        </div>
        <div class="user-groups" v-if="group.length > 0">
          <Divider plain>{{ t('oj.group') }}</Divider>
          <Space :size="8" class="user-group-container" wrap>
            <router-link v-for="item in group" :key="item" :to="{ name: 'ranklist', query: { gid: getGID(item) } }">
              <span class="user-group">{{ item }}</span>
            </router-link>
          </Space>
        </div>
        <div class="user-statistic">
          <Divider plain>{{ t('oj.statistics') }}</Divider>
          <div class="user-statistic-container">
            <router-link class="user-statistic-item"
              :to="{ name: 'status', query: { uid: user.uid, judge: judge.Accepted } }">
              <h1>{{ user.solve }}</h1>
              <h4>{{ t('oj.solved') }}</h4>
            </router-link>
            <router-link class="user-statistic-item" :to="{ name: 'status', query: { uid: user.uid } }">
              <h1>{{ user.submit }}</h1>
              <h4>{{ t('oj.submit') }}</h4>
            </router-link>
          </div>
          <Divider />
        </div>
      </div>
      <div class="user-content">
        <div class="user-status">
          <div class="user-status-name">{{ t('oj.solved') }}</div>
          <div v-if="solved.length === 0" class="status-empty">
            <Icon type="ios-planet-outline" class="empty-icon" />
            <span class="empty-text">{{ t('oj.empty_content') }}</span>
          </div>
          <Space v-else class="user-status-items" :size="[2, 8]" wrap>
            <router-link v-for="item in solved" :key="item" :to="{ name: 'problemInfo', params: { pid: item } }">
              <Button class="user-status-item" type="text" size="small">{{ item }}</Button>
            </router-link>
          </Space>
        </div>
        <div class="user-status">
          <div class="user-status-name">{{ t('oj.unsolved') }}</div>
          <div v-if="unsolved.length === 0" class="status-empty">
            <Icon type="ios-planet-outline" class="empty-icon" />
            <span class="empty-text">{{ t('oj.empty_content') }}</span>
          </div>
          <Space v-else class="user-status-items" :size="[2, 8]" wrap>
            <router-link v-for="item in unsolved" :key="item" :to="{ name: 'problemInfo', params: { pid: item } }">
              <Button class="user-status-item" type="text" size="small">{{ item }}</Button>
            </router-link>
          </Space>
        </div>
      </div>
    </div>
    <div class="user-tab user-edit" v-show="view === 'edit'">
      <Form :label-width="100" :rules="ruleValidate" :model="user" ref="userForm">
        <FormItem :label="t('oj.username')" prop="uid">
          <Input v-model="user.uid" disabled />
        </FormItem>
        <FormItem :label="t('oj.nick')" prop="nick">
          <Input v-model="user.nick" />
        </FormItem>
        <FormItem :label="t('oj.motto')" prop="motto">
          <Input v-model="user.motto" type="textarea" />
        </FormItem>
        <FormItem :label="t('oj.mail')" prop="mail">
          <Input v-model="user.mail" />
        </FormItem>
        <FormItem :label="t('oj.school')" prop="school">
          <Input v-model="user.school" />
        </FormItem>
        <FormItem v-if="canRemove" :label="t('oj.privilege')">
          <RadioGroup v-model="user.privilege" type="button">
            <Radio v-for="item in privilegeOptions" :key="item.value" :label="item.value" :disabled="item.disabled">
              {{ item.label }}
            </Radio>
          </RadioGroup>
        </FormItem>
        <FormItem>
          <Button type="primary" size="large" @click="updateProfile">{{ t('oj.submit') }}</Button>
        </FormItem>
      </Form>
      <Form :label-width="100">
        <Divider simple>{{ t('oj.security') }}</Divider>
        <FormItem :label="t('oj.password')">
          <Input v-model="newPwd" type="password" :placeholder="t('oj.leave_it_blank_if_no_change')" />
        </FormItem>
        <FormItem :label="t('oj.password_confirm')">
          <Input v-model="checkPwd" type="password" :placeholder="t('oj.leave_it_blank_if_no_change')" />
        </FormItem>
        <FormItem>
          <Button type="primary" size="large" @click="updatePassword">{{ t('oj.submit') }}</Button>
        </FormItem>
      </Form>
    </div>
    <Spin size="large" fix :show="loading" class="wrap-loading" />
  </div>
</template>

<style lang="stylus">
.user-tabs
  .ivu-tabs-nav-scroll
    padding 0 40px

@media screen and (max-width: 1024px)
  .user-tabs
    .ivu-tabs-nav-scroll
      padding 0 20px
</style>

<style lang="stylus" scoped>
.user-wrap
  width 100%
  max-width 1024px
  padding 0
.user-warp-edit
  max-width 768px
.user-tabs
  padding-top 24px
  margin-bottom -16px

.user-overwiew
  display flex
  gap 40px
  padding 40px
  .user-infobar
    flex 0 0 256px
  .user-content
    flex 1

.user-avatar
  width 100%
  max-width 256px
  border-radius 4px
  border 1px solid #e8eaec
.user-name
  .user-nickname
    font-size 24px
    font-weight bold
  .user-username
    font-size 16px
    color hsla(0, 0%, 0%, 0.45)
  .user-nickname, .user-username
    word-break break-all
    line-break anywhere
.user-info
  div
    margin 4px 0
    .icon
      margin-right 8px
.user-groups
  text-align center
  .user-group
    display inline-block
    height 28px
    line-height 28px
    padding 0 10px
    border 1px solid #e8eaec
    border-radius 3px
    background #f7f7f7
    font-size 12px
    vertical-align middle
    color #515a6e
.user-statistic-container
  display flex
  gap 10px
  .user-statistic-item
    flex 1
    text-align center
    font-family verdana, arial, sans-serif
    h1
      font-size 24px
      font-weight bold
      color hsla(0, 0%, 0%, 0.85)
    h4
      font-size 12px
      color hsla(0, 0%, 0%, 0.45)
.user-name, .user-motto, .user-info, .user-groups, .user-statistic
  margin 16px 0

.user-status
  margin-bottom 16px
  .user-status-name
    font-size 20px
    font-weight bold
    margin-bottom 8px
  .user-status-items
    text-align center
  .user-status-item
    width 52px

.user-edit
  padding 40px
.status-empty
  margin-bottom 20px
  padding 32px
  border 1px solid #dcdee2
  border-radius 4px
  display flex
  align-items center
  justify-content center
  .empty-icon
    font-size 32px
  .empty-text
    margin-left 32px

@media screen and (max-width: 1024px)
  .user-tabs
    padding-top 12px
  .user-overwiew
    gap 20px
  .user-overwiew, .user-edit
    padding 20px

@media screen and (max-width: 768px)
  .user-overwiew
    display block
    .user-infobar
      padding-top 40px
      text-align center
</style>
