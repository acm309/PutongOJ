<template>
  <div class="nav-wrap">
    <Layout>
      <Header :style="{position: 'fixed', width: '100%', 'z-index': 100}">
        <Menu mode="horizontal" theme="light" @on-select="routerTo" :active-name="active">
          <div class="left">
            <MenuItem name="home">
              <Icon type="ios-home"></Icon>Home
            </MenuItem>
            <MenuItem name="problemList">
                <Icon type="ios-keypad"></Icon>Problem
            </MenuItem>
            <MenuItem name="discuss">
              <Icon type="chatbubble-working"></Icon>Discuss
            </MenuItem>
            <MenuItem name="status">
              <Icon type="refresh"></Icon>Status
            </MenuItem>
            <MenuItem name="ranklist">
              <Icon type="stats-bars"></Icon>Ranklist
            </MenuItem>
            <MenuItem name="contestList">
              <Icon type="android-bar"></Icon>Contest
            </MenuItem>
            <MenuItem name="faq">
              <Icon type="help-circled"></Icon>FAQ
            </MenuItem>
            <Submenu v-if="isAdmin" name="admin">
              <template slot="title">
                <Icon type="paper-airplane"></Icon>Admin
              </template>
              <MenuItem name="problemCreate">Create Problems</MenuItem>
              <MenuItem name="contestCreate">Create Contests</MenuItem>
              <MenuItem name="newsCreate">Create News</MenuItem>
              <MenuItem name="userEdit">User Management</MenuItem>
            </Submenu>
          </div>
        </Menu>
        <div class="right">
          <Dropdown v-if="isLogined" @on-click="profileAction">
            <a href="javascript:void(0)">
              {{ profile.uid }}
              <Icon type="arrow-down-b"></Icon>
            </a>
            <DropdownMenu slot="list">
              <DropdownItem name="profile">Profile</DropdownItem>
              <DropdownItem name="logout">Logout</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Button type="text" @click="login" v-else>Login / Register</Button>
        </div>
      </Header>
      <Content :style="{margin: '88px 20px 0', background: '#fff', minHeight: '500px', padding: '20px 40px'}">
        <router-view></router-view>
      </Content>
     <Footer class="layout-footer-center">
       <p>Server Time: {{ currentTime | timePretty }}</p>
       <strong>Putong OJ</strong> by <a href="https://github.com/acm309" target="_blank">acm309 <Icon type="social-github"></Icon>.</a>
       The source code is licensed <a href="http://opensource.org/licenses/mit-license.php" target="_blank">MIT</a>.
     </Footer>
    </Layout>
    <Dialog></Dialog>
  </div>
</template>
<script>
import { mapMutations, mapGetters, mapState } from 'vuex'
import { TRIGGER_LOGIN } from '@/store/types'
import Dialog from './LoginAndRegister'

export default {
  components: {
    Dialog
  },
  computed: {
    ...mapGetters({
      isLogined: 'session/isLogined',
      profile: 'session/profile',
      isAdmin: 'session/isAdmin',
      currentTime: 'currentTime'
    }),
    ...mapState({
      active: state => state.route.name
    })
  },
  methods: {
    ...mapMutations('session', {
      login: TRIGGER_LOGIN
    }),
    routerTo (name) {
      this.$router.push({ name })
    },
    profileAction (name) {
      if (name === 'logout') {
        this.$store.dispatch('session/logout').then(() => this.$Message.info('bye bye!'))
      } else if (name === 'profile') {
        this.$router.push({ name: 'userInfo', params: { uid: this.profile.uid } })
      }
    }
  }
}
</script>
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
