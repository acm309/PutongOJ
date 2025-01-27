<script setup>
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/store/modules/session'
import { useHumanLanguage } from '@/util/helper'

import { Menu, MenuItem, MenuGroup, Submenu, Icon, Dropdown, DropdownMenu, DropdownItem, Button } from 'view-ui-plus'

const sessionStore = useSessionStore()
const route = useRoute()
const router = useRouter()
const $Message = inject('$Message')
const { toggleLoginState, logout } = sessionStore
const { profile, isAdmin, isLogined } = $(storeToRefs(sessionStore))

const active = $computed(() => route.name)
const { t, locale } = useI18n()
let selectedLang = $(useHumanLanguage())
locale.value = selectedLang

const login = toggleLoginState

function routerTo(name) {
  if (route.name !== name)
    router.push({ name })
}

function profileAction(name) {
  if (name === 'logout')
    logout().then(() => $Message.info('bye bye!'))
  else if (name === 'profile')
    router.push({ name: 'userInfo', params: { uid: profile.uid } })
}

function langSelected(lang) {
  locale.value = selectedLang = lang
}

function getMenuItems() {
  return [
    { name: 'home', icon: 'ios-home', label: t('oj.home') },
    { name: 'problemList', icon: 'ios-keypad', label: t('oj.problem_list') },
    { name: 'status', icon: 'md-refresh', label: t('oj.status_list') },
    { name: 'ranklist', icon: 'ios-stats', label: t('oj.ranklist') },
    { name: 'contestList', icon: 'ios-trophy', label: t('oj.contest_list') },
    { name: 'discuss', icon: 'ios-quote', label: t('oj.discussion_list') },
    { name: 'faq', icon: 'md-help-circle', label: t('oj.faq') },
  ]
}

function getAdminMenuItems() {
  return [
    { name: 'problemCreate', label: t('oj.create_problem') },
    { name: 'contestCreate', label: t('oj.create_contest') },
    { name: 'newsCreate', label: t('oj.create_news') },
    { name: 'userEdit', label: t('oj.user_management') },
  ]
}
</script>

<template>
  <Header class="layout-header">
    <Menu class="menu-table" mode="horizontal" theme="light" :active-name="active" @on-select="routerTo">
      <MenuItem v-for="item in getMenuItems()" :key="item.name" :name="item.name">
      <Icon :type="item.icon" />{{ item.label }}
      </MenuItem>
      <Submenu v-if="isAdmin" name="admin">
        <template #title>
          <Icon type="md-paper-plane" />{{ t('oj.admin') }}
        </template>
        <MenuItem v-for="item in getAdminMenuItems()" :key="item.name" :name="item.name">
        {{ item.label }}
        </MenuItem>
      </Submenu>
    </Menu>
    <Menu class="menu-mobile" mode="horizontal" :active-name="active" @on-select="routerTo">
      <Submenu name="site">
        <template #title>
          <span style="margin-right: 8px">Putong OJ</span>
        </template>
        <MenuItem v-for="item in getMenuItems()" :key="item.name" :name="item.name">
        <Icon :type="item.icon" />{{ item.label }}
        </MenuItem>
        <MenuGroup v-if="isAdmin" title="Admin">
          <MenuItem v-for="item in getAdminMenuItems()" :key="item.name" :name="item.name">
          {{ item.label }}
          </MenuItem>
        </MenuGroup>
      </Submenu>
    </Menu>
    <div class="right">
      <Dropdown v-if="isLogined" @on-click="profileAction">
        <a href="javascript:void(0)">
          <Icon type="md-contact" />
          {{ profile.uid }}
          <Icon type="ios-arrow-down" />
        </a>
        <template #list>
          <DropdownMenu>
            <DropdownItem name="profile">
              {{ t('oj.profile') }}
            </DropdownItem>
            <DropdownItem name="logout">
              {{ t('oj.logout') }}
            </DropdownItem>
          </DropdownMenu>
        </template>
      </Dropdown>
      <Button v-else type="text" @click="login">
        {{ t("oj.login") }} / {{ t("oj.register") }}
      </Button>
      <Dropdown @on-click="langSelected">
        <Button type="text">
          <span>({{ t('oj.human_language') }})</span>
          <img src="../assets/i18n.svg" alt="" style="height: 1.2em">
        </Button>
        <template #list>
          <DropdownMenu>
            <DropdownItem name="en-US">
              English
            </DropdownItem>
            <DropdownItem name="zh-CN">
              简中
            </DropdownItem>
          </DropdownMenu>
        </template>
      </Dropdown>
    </div>
  </Header>
</template>

<style lang="stylus" scoped>
.layout-header
  display flex
  position fixed
  z-index 100
  top 0
  left 0
  width 100%
  height 62px
  line-height 62px
  background #fff
  border-bottom 1px solid #d7dde4
  justify-content space-between
  box-shadow 0 3px 5px -1px rgba(0, 0, 0, .1), 
             0 6px 10px 0 rgba(0, 0, 0, .07),  
             0 1px 18px 0 rgba(0, 0, 0, .06)
.ivu-menu-horizontal
  flex none
  background none
  height 62px
  line-height 62px
.ivu-menu-horizontal.ivu-menu-light:after
  height 0
.right
  flex none
  .ivu-btn
    font-size: 14px
    margin-bottom: 6px
@media screen and (max-width: 1024px)
  .ivu-layout-header
    padding 0 14px
  .ivu-menu-horizontal .ivu-menu-submenu
    font-size 16px
    padding 0 0 0 12px
  .menu-table
    display none
@media screen and (min-width: 1025px)
  .menu-mobile
    display none
</style>
