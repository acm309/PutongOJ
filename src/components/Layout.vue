<template lang="html">
  <div class="nav-cont layout">
    <Layout>
      <Header :style="{position: 'fixed', width: '100%', 'z-index': 100}">
        <Menu mode="horizontal" theme="light" active-name="1">
          <div class="left">
            <MenuItem name="1">
              <Icon type="ios-home"></Icon>Home
            </MenuItem>
            <MenuItem name="2">
              <Icon type="ios-keypad"></Icon>Problem
            </MenuItem>
            <MenuItem name="3">
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
          <Button type="text">Login</Button>
          <Button type="text">Register</Button>
        </div>
      </Header>
      <Content :style="{margin: '88px 20px 0', background: '#fff', minHeight: '500px',
      padding: '20px 40px'}">
        <slot></slot>
      </Content>
     <Footer class="layout-footer-center">
       <strong>Putong OJ</strong> by <a href="https://github.com/acm309" target="_blank">acm309 <Icon type="social-github"></Icon>.</a>
       The source code is licensed <a href="http://opensource.org/licenses/mit-license.php" target="_blank">MIT</a>.
     </Footer>
    </Layout>
  </div>
</template>

<script>
export default {
}
</script>

<style lang="stylus">
.nav-cont
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

.layout
    border: 1px solid #d7dde4
    background: #f5f7f9
    position: relative
    border-radius: 4px
    overflow: hidden

.layout-logo
    width: 100px
    height: 30px
    background: #5b6270
    border-radius: 3px
    float: left
    position: relative
    top: 15px
    left: 20px

.layout-nav
    width: 420px
    margin: 0 auto
    margin-right: 20px

.layout-footer-center
    text-align: center
</style>
