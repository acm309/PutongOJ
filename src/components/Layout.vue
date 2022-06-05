<script setup>
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from './LoginAndRegister'
import { useSessionStore } from '@/store/modules/session'
import { useRootStore } from '@/store'
import { timePretty } from '@/util/formate'
import { useHumanLanguage } from '@/util/helper'

const rootStore = useRootStore()
const sessionStore = useSessionStore()
const route = useRoute()
const router = useRouter()
const $Message = inject('$Message')
const { toggleLoginState, logout } = sessionStore
const { currentTime } = $(storeToRefs(rootStore))
const { profile, isAdmin, isLogined } = $(storeToRefs(sessionStore))

const active = $computed(() => route.name)
const { t, locale } = useI18n({ useScope: 'global' })
let selectedLang = $(useHumanLanguage())
locale.value = selectedLang

const login = toggleLoginState
const routerTo = (name) => {
  if (route.name !== name) {
    router.push({ name })
  }
}

function profileAction (name) {
  if (name === 'logout') {
    logout().then(() => $Message.info('bye bye!'))
  } else if (name === 'profile') {
    router.push({ name: 'userInfo', params: { uid: profile.uid } })
  }
}

function langSelected (lang) {
  locale.value = selectedLang = lang
}
</script>

<script>
// Must be renamed; otherwise, it will be confused with Layout.vue in 'view'.
export default {
  name: 'OjLayout',
}
</script>

<template>
  <div class="nav-wrap">
    <Layout>
      <Header :style="{ 'position': 'fixed', 'width': '100%', 'z-index': 100 }">
        <Menu mode="horizontal" theme="light" :active-name="active" @on-select="routerTo">
          <div class="left">
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
                <Icon type="md-paper-plane" />Admin
              </template>
              <MenuItem name="problemCreate">
                Create Problems
              </MenuItem>
              <MenuItem name="contestCreate">
                Create Contests
              </MenuItem>
              <MenuItem name="newsCreate">
                Create News
              </MenuItem>
              <MenuItem name="userEdit">
                User Management
              </MenuItem>
            </Submenu>
          </div>
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
      <Content :style="{ margin: '88px 20px 0', background: '#fff', minHeight: '500px', padding: '20px 40px' }">
        <router-view />
      </Content>
      <Footer class="layout-footer-center">
        <p>Server Time: {{ timePretty(currentTime) }}</p>
        <strong>Putong OJ</strong> by <a href="https://github.com/acm309" target="_blank">acm309 <Icon type="social-github" />.</a>
        The source code is licensed <a href="http://opensource.org/licenses/mit-license.php" target="_blank">MIT</a>.
      </Footer>
    </Layout>
    <Dialog />
  </div>
</template>

<style lang="stylus">
.nav-wrap
  border: 1px solid #d7dde4
  background: #f5f7f9
  position: relative
  border-radius: 4px
  overflow: hidden
  .ivu-layout-header
    display: flex
    justify-content: space-between
    background: #fff
    padding: 2px 0px 0px 0px
    height: 62px
    line-height: 62px
    box-shadow: 0 2px 3px hsla(0,0%,4%,.1)
  .ivu-menu-horizontal
    height: 62px
    line-height: 60px
  .left
    width: 900px
    margin: 0 auto
    margin-left: 5%
  .right
    margin-right: 5%
    .ivu-btn
      font-size: 14px
      margin-bottom: 6px
  .layout-footer-center
    text-align: center
    p
      margin-bottom: 8px
  .i18n::before
    content: url('../assets/i18n.svg')
    // margin-right: 5px
</style>
