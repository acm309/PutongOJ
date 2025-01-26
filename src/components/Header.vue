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
</script>

<template>
  <Header class="layout-header">
    <Menu class="menu-table" mode="horizontal" theme="light" :active-name="active" @on-select="routerTo">
      <MenuItem name="home">
      <Icon type="ios-home" />{{ t('oj.home') }}
      </MenuItem>
      <MenuItem name="problemList">
      <Icon type="ios-keypad" />{{ t('oj.problem_list') }}
      </MenuItem>
      <MenuItem name="status">
      <Icon type="md-refresh" />{{ t('oj.status_list') }}
      </MenuItem>
      <MenuItem name="ranklist">
      <Icon type="ios-stats" />{{ t('oj.ranklist') }}
      </MenuItem>
      <MenuItem name="contestList">
      <Icon type="ios-trophy" />{{ t('oj.contest_list') }}
      </MenuItem>
      <MenuItem name="discuss">
      <Icon type="ios-quote" />{{ t('oj.discussion_list') }}
      </MenuItem>
      <MenuItem name="faq">
      <Icon type="md-help-circle" />{{ t('oj.faq') }}
      </MenuItem>
      <Submenu v-if="isAdmin" name="admin">
        <template #title>
          <Icon type="md-paper-plane" />{{ t('oj.admin') }}
        </template>
        <MenuItem name="problemCreate">
        {{ t('oj.create_problem') }}
        </MenuItem>
        <MenuItem name="contestCreate">
        {{ t('oj.create_contest') }}
        </MenuItem>
        <MenuItem name="newsCreate">
        {{ t('oj.create_news') }}
        </MenuItem>
        <MenuItem name="userEdit">
        {{ t('oj.user_management') }}
        </MenuItem>
      </Submenu>
    </Menu>
    <Menu class="menu-mobile" mode="horizontal" :active-name="active" @on-select="routerTo">
      <Submenu name="site">
        <template #title >
          <span style="margin-right: 8px">Putong OJ</span>
        </template>
        <MenuItem name="home">
        <Icon type="ios-home" />{{ t('oj.home') }}
        </MenuItem>
        <MenuItem name="problemList">
        <Icon type="ios-keypad" />{{ t('oj.problem_list') }}
        </MenuItem>
        <MenuItem name="status">
        <Icon type="md-refresh" />{{ t('oj.status_list') }}
        </MenuItem>
        <MenuItem name="ranklist">
        <Icon type="ios-stats" />{{ t('oj.ranklist') }}
        </MenuItem>
        <MenuItem name="contestList">
        <Icon type="ios-trophy" />{{ t('oj.contest_list') }}
        </MenuItem>
        <MenuItem name="discuss">
        <Icon type="ios-quote" />{{ t('oj.discussion_list') }}
        </MenuItem>
        <MenuItem name="faq">
        <Icon type="md-help-circle" />{{ t('oj.faq') }}
        </MenuItem>
        <MenuGroup v-if="isAdmin" title="Admin">
          <MenuItem name="problemCreate">
          {{ t('oj.create_problem') }}
          </MenuItem>
          <MenuItem name="contestCreate">
          {{ t('oj.create_contest') }}
          </MenuItem>
          <MenuItem name="newsCreate">
          {{ t('oj.create_news') }}
          </MenuItem>
          <MenuItem name="userEdit">
          {{ t('oj.user_management') }}
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
  box-shadow 0 2px 3px hsla(0,0%,4%,.1)
.ivu-menu-horizontal
  flex none
  background none
  height 61.5px
  line-height 61.5px
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
