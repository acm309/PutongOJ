<script>
import { mapActions, mapState } from 'pinia'
import Dialog from './LoginAndRegister'
import { useSessionStore } from '@/store/modules/session'
import { useRootStore } from '@/store'
import { timePretty } from '@/util/formate'

export default {
  components: {
    Dialog,
  },
  computed: {
    ...mapState(useRootStore, [ 'currentTime' ]),
    ...mapState(useSessionStore, [ 'profile', 'isAdmin', 'isLogined' ]),
    active () {
      return this.$route.name
    },
  },
  methods: {
    timePretty,
    login () {
      useSessionStore().toggleLoginState()
    },
    ...mapActions(useSessionStore, [ 'logout' ]),
    routerTo (name) {
      if (this.$route.name !== name) { this.$router.push({ name }) }
    },
    profileAction (name) {
      if (name === 'logout') {
        this.logout().then(() => this.$Message.info('bye bye!'))
      } else if (name === 'profile') {
        this.$router.push({ name: 'userInfo', params: { uid: this.profile.uid } })
      }
    },
  },
}
</script>

<template>
  <div class="nav-wrap">
    <Layout>
      <Header :style="{ 'position': 'fixed', 'width': '100%', 'z-index': 100 }">
        <Menu mode="horizontal" theme="light" :active-name="active" @on-select="routerTo">
          <div class="left">
            <MenuItem name="home">
              <Icon type="ios-home" />Home
            </MenuItem>
            <MenuItem name="problemList">
              <Icon type="ios-keypad" />Problem
            </MenuItem>
            <MenuItem name="status">
              <Icon type="md-refresh" />Status
            </MenuItem>
            <MenuItem name="ranklist">
              <Icon type="ios-stats" />Ranklist
            </MenuItem>
            <MenuItem name="contestList">
              <Icon type="ios-trophy" />Contest
            </MenuItem>
            <MenuItem name="discuss">
              <Icon type="ios-quote" />Discuss
            </MenuItem>
            <MenuItem name="faq">
              <Icon type="md-help-circle" />FAQ
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
                  Profile
                </DropdownItem>
                <DropdownItem name="logout">
                  Logout
                </DropdownItem>
              </DropdownMenu>
            </template>
          </Dropdown>
          <Button v-else type="text" @click="login">
            Login / Register
          </Button>
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
</style>
