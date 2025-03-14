<script setup>
import pangu from 'pangu'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import { useRootStore } from '@/store'
import { useUserStore } from '@/store/modules/user'
import { timePretty } from '@/util/formate'

import { Button, Divider, Icon, Space } from 'view-ui-plus'

const { t } = useI18n()

const rootStore = useRootStore()
const userStore = useUserStore()

const { judge } = $(storeToRefs(rootStore))
const { solved, unsolved, user } = $(storeToRefs(userStore))

const nickname = $computed(() => user.nick || user.uid)
const username = $computed(() => user.nick && user.nick !== user.uid ? user.uid : '')
</script>

<template>
  <div class="user-overwiew">
    <div class="user-infobar">
      <img class="user-avatar" v-if="user.avatar" :src="user.avatar" :alt="`${nickname}'s Avatar`" />
      <img class="user-avatar" v-else src="@/assets/logo.jpg" alt="Default Avatar" />
      <div class="user-name">
        <div class="user-nickname">{{ nickname }}</div>
        <div class="user-username" v-if="username">{{ username }}</div>
      </div>
      <div class="user-motto" v-if="user.motto">{{ pangu.spacing(user.motto).trim() }}</div>
      <div class="user-info">
        <div v-if="user.mail" class="user-mail">
          <Icon class="icon" type="md-mail" />{{ user.mail }}
        </div>
        <div v-if="user.school" class="user-school">
          <Icon class="icon" type="md-school" />{{ user.school }}
        </div>
        <div class="user-create">
          <Icon class="icon" type="md-calendar" />{{ timePretty(user.create, 'yyyy-MM-dd') }}
        </div>
      </div>
      <div class="user-groups" v-if="user.groups?.length > 0">
        <Divider plain>{{ t('oj.group') }}</Divider>
        <Space :size="8" class="user-group-container" wrap>
          <router-link v-for="group in user.groups" :key="group.gid" :to="{ name: 'ranklist', query: { gid: group.gid } }">
            <span class="user-group">{{ group.title }}</span>
          </router-link>
        </Space>
      </div>
      <div class="user-statistic">
        <Divider plain>{{ t('oj.statistics') }}</Divider>
        <div class="user-statistic-container">
          <router-link class="user-statistic-item"
            :to="{ name: 'status', query: { uid: user.uid, judge: judge.Accepted } }">
            <h1>{{ solved.length }}</h1>
            <h4>{{ t('oj.solved') }}</h4>
          </router-link>
          <router-link class="user-statistic-item" :to="{ name: 'status', query: { uid: user.uid } }">
            <h1>{{ solved.length + unsolved.length }}</h1>
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
</template>

<style lang="stylus" scoped>
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
    color hsl(0, 0%, 50%)
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
    font-family var(--font-verdana)
    h1
      font-size 24px
      font-weight bold
      color hsl(0, 0%, 30%)
    h4
      font-size 12px
      color hsl(0, 0%, 50%)
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
  .user-overwiew
    gap 20px
    padding 20px

@media screen and (max-width: 768px)
  .user-overwiew
    display block
    .user-infobar
      padding-top 40px
      text-align center
</style>
