<template lang="html">
  <div class="nav-wrap">
    <Layout>
      <Header :style="{position: 'fixed', width: '100%', 'z-index': 100}">
        <Menu mode="horizontal" theme="light" @on-select="routerTo" active-name="1">
          <div class="left">
            <MenuItem name="1">
              <Icon type="ios-home"></Icon>Home
            </MenuItem>
            <MenuItem name="problemList">
                <Icon type="ios-keypad"></Icon>Problem
            </MenuItem>
            <MenuItem name="status">
              <Icon type="refresh"></Icon>Status
            </MenuItem>
            <MenuItem name="4">
              <Icon type="stats-bars"></Icon>Ranklist
            </MenuItem>
            <MenuItem name="5">
              <Icon type="android-bar"></Icon>Contest
            </MenuItem>
            <MenuItem name="6">
              <Icon type="help-circled"></Icon>FAQ
            </MenuItem>
            <Submenu name="7">
              <template slot="title">
                  <Icon type="paper-airplane"></Icon>Admin
              </template>
              <MenuItem name="2-1">Create Problems</MenuItem>
              <MenuItem name="2-2">Create Contests</MenuItem>
              <MenuItem name="2-3">User Management</MenuItem>
            </Submenu>
          </div>
        </Menu>
        <div class="right">
          <Button type="text" @click="showDialog">Login / Register</Button>
          <Modal v-model="modal" width="360">
            <Tabs v-model="event">
              <TabPane label="Login" name="login"></TabPane>
              <TabPane label="Register" name="register"></TabPane>
            </Tabs>
          </Modal>
        </div>
      </Header>
      <Content :style="{margin: '88px 20px 0', background: '#fff', minHeight: '500px', padding: '20px 40px'}">
        <router-view></router-view>
      </Content>
     <Footer class="layout-footer-center">
       <strong>Putong OJ</strong> by <a href="https://github.com/acm309" target="_blank">acm309 <Icon type="social-github"></Icon>.</a>
       The source code is licensed <a href="http://opensource.org/licenses/mit-license.php" target="_blank">MIT</a>.
     </Footer>
    </Layout>
  </div>
</template>

<script>
import Dialog from './Dialog.vue'

export default {
  data: () => ({
    modal: false,
    event: 'login'
  }),
  methods: {
    routerTo (name) {
      this.$router.push({ name: name })
    },
    showDialog () {
      this.modal = true
    }
  },
  components: {
    Dialog
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
    width: 800px
    margin: 0 auto
    margin-left: 5%
  .right
    margin-right: 5%
    .ivu-btn
      font-size: 14px
      margin-bottom: 6px
  .layout-footer-center
    text-align: center
</style>
