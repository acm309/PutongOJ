<template lang="html">
  <div class="nav-cont">
    <Layout>
      <Header :style="{position: 'fixed', width: '100%'}">
        <Menu mode="horizontal" theme="light" active-name="1">
          <div class="left">
            <MenuItem name="1">
              <Icon type="ios-home"></Icon>Home
            </MenuItem>
            <MenuItem name="2">
              <Icon type="ios-keypad"></Icon>Problems
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
              <Icon type="clipboard"></Icon>FAQ
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
</style>
