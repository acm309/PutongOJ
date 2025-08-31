<script setup>
import { storeToRefs } from 'pinia'
import { Button, Dropdown, DropdownItem, DropdownMenu, Icon, Menu, MenuGroup, MenuItem, Submenu } from 'view-ui-plus'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/store/modules/session'

const sessionStore = useSessionStore()
const route = useRoute()
const router = useRouter()
const $Message = inject('$Message')
const { toggleLoginState, logout } = sessionStore
const { profile, isAdmin, isLogined } = $(storeToRefs(sessionStore))
const active = $computed(() => route.name)
const { t } = useI18n()
const login = toggleLoginState

function routerTo (name) {
  if (route.name !== name) {
    router.push({ name })
  }
}

function profileAction (name) {
  if (name === 'logout') {
    logout().then(() => $Message.info('bye bye!'))
  } else if (name === 'profile') {
    router.push({ name: 'userProfile', params: { uid: profile.uid } })
  } else if (name === 'settings') {
    router.push({ name: 'userEdit', params: { uid: profile.uid } })
  }
}

function getMenuItems () {
  const menuItems = [
    { name: 'home', icon: 'ios-home', label: t('oj.home') },
    { name: 'courses', icon: 'ios-book', label: t('oj.course') },
    { name: 'problems', icon: 'ios-keypad', label: t('oj.problem_list') },
    { name: 'ranklist', icon: 'ios-stats', label: t('oj.ranklist') },
    { name: 'contestList', icon: 'ios-trophy', label: t('oj.contest_list') },
    {
      name: 'more',
      icon: 'logo-buffer',
      label: t('oj.more'),
      children: [
        { name: 'discuss', icon: 'ios-quote', label: t('oj.discussion_list') },
        { name: 'status', icon: 'ios-pulse', label: t('oj.status_list') },
        { name: 'faq', icon: 'md-help-circle', label: t('oj.faq') },
      ],
    },
  ]

  if (isAdmin) {
    menuItems.push({
      name: 'admin',
      icon: 'md-paper-plane',
      label: t('oj.admin'),
      children: [
        { name: 'problemCreate', label: t('oj.create_problem') },
        { name: 'contestCreate', label: t('oj.create_contest') },
        { name: 'newsCreate', label: t('oj.create_news') },
        { name: 'userManager', label: t('oj.user_management') },
        { name: 'tagManager', label: t('oj.tag_management') },
        { name: 'groupManager', label: t('oj.group_management') },
      ],
    })
  }

  return menuItems
}
</script>

<template>
  <Header class="layout-header">
    <Menu class="menu-table" mode="horizontal" theme="light" :active-name="active" @on-select="routerTo">
      <template v-for="item in getMenuItems()" :key="item.name">
        <MenuItem v-if="!item.children" :name="item.name" class="menu-item">
          <Icon :type="item.icon" class="menu-icon" />{{ item.label }}
        </MenuItem>
        <Submenu v-else :name="item.name" class="submenu">
          <template #title>
            <Icon :type="item.icon" class="menu-icon" />
            <span class="submenu-title">{{ item.label }}</span>
          </template>
          <MenuItem v-for="child in item.children" :key="child.name" :name="child.name" class="submenu-item">
            <Icon v-if="child.icon" :type="child.icon" class="menu-icon" />{{ child.label }}
          </MenuItem>
        </Submenu>
      </template>
    </Menu>
    <Menu class="menu-mobile" mode="horizontal" :active-name="active" @on-select="routerTo">
      <Submenu name="site" class="mobile-submenu">
        <template #title>
          <span class="mobile-submenu-title">Putong OJ</span>
        </template>
        <div v-for="item in getMenuItems()" :key="item.name">
          <template v-if="!item.children">
            <MenuItem :name="item.name" class="mobile-menu-item">
              <Icon :type="item.icon" class="menu-icon" />{{ item.label }}
            </MenuItem>
          </template>
          <template v-else>
            <MenuGroup :title="item.label" class="mobile-menu-group">
              <MenuItem v-for="child in item.children" :key="child.name" :name="child.name" class="mobile-submenu-item">
                <Icon v-if="child.icon" :type="child.icon" class="menu-icon" />
                {{ child.label }}
              </MenuItem>
            </MenuGroup>
          </template>
        </div>
      </Submenu>
    </Menu>
    <div class="header-right">
      <Dropdown v-if="isLogined" class="profile-dropdown" @on-click="profileAction">
        <a href="javascript:void(0)" class="profile-link">
          <Icon type="md-contact" class="profile-icon" />
          {{ profile.uid }}
          <Icon type="ios-arrow-down" class="dropdown-arrow" />
        </a>
        <template #list>
          <DropdownMenu class="dropdown-menu">
            <DropdownItem name="profile" class="dropdown-item">
              {{ t('oj.profile') }}
            </DropdownItem>
            <DropdownItem name="settings" class="dropdown-item">
              {{ t('oj.settings') }}
            </DropdownItem>
            <DropdownItem name="logout" class="dropdown-item">
              {{ t('oj.logout') }}
            </DropdownItem>
          </DropdownMenu>
        </template>
      </Dropdown>
      <Button v-else type="text" class="login-button" @click="login">
        {{ t("oj.login") }} / {{ t("oj.register") }}
      </Button>
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

.menu-table, .menu-mobile
  flex none
  background none
  height 62px
  line-height 62px
  &:after
    height 0 !important

.menu-item, .submenu-item, .mobile-menu-item, .mobile-submenu-item
  font-size 14px
.menu-icon
  margin-right 8px
.submenu, .mobile-submenu
  padding-right 8px !important
.mobile-submenu
  font-size 16px
.submenu-title, .mobile-submenu-title
  margin-right 8px

.header-right
  margin-left 16px
  flex none
  display flex
  align-items center

.profile-dropdown
  margin-right 16px
.profile-link
  display flex
  align-items center
  color var(--oj-primary-color) !important
  text-decoration none
.profile-icon
  margin-right 8px
.dropdown-arrow, .profile-icon
  margin-bottom -4px

.dropdown-arrow
  margin-left 8px
.dropdown-item
  padding 8px 16px

.login-button
  font-size 14px

@media screen and (max-width: 1024px)
  .layout-header
    padding 0 14px
  .menu-table
    display none

@media screen and (min-width: 1025px)
  .menu-mobile
    display none
</style>
