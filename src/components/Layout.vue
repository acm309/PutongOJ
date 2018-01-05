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
          <Modal v-model="modal" @on-ok="submitForm">
            <Tabs v-model="session">
              <TabPane label="Login" name="login">
                <Form ref="loginForm" :model="loginForm" :rules="loginRules" :label-width="100">
                  <FormItem class="loginuid" label="Username" prop="uid">
                    <Input v-model="loginForm.uid"></Input>
                  </FormItem>
                  <FormItem class="loginpwd" label="Password" prop="pwd">
                    <Input v-model="loginForm.pwd" type="password"></Input>
                  </FormItem>
                </Form>
              </TabPane>
              <TabPane label="Register" name="register">
                <Form ref="registerForm" :model="registerForm" :rules="registerRules" :label-width="100">
                  <FormItem label="Username" prop="uid">
                    <Input v-model="registerForm.uid"></Input>
                  </FormItem>
                  <FormItem label="Nickname" prop="nick">
                    <Input v-model="registerForm.nick"></Input>
                  </FormItem>
                  <FormItem label="Password" prop="pwd">
                    <Input v-model="registerForm.pwd" type="password"></Input>
                  </FormItem>
                  <FormItem label="CheckPwd" prop="checkPwd">
                    <Input v-model="registerForm.checkPwd" type="password"></Input>
                  </FormItem>
                </Form>
              </TabPane>
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
export default {
  data () {
    // 自定义验证规则
    let validatePass1 = (rule, value, callback) => {
      // 5-20位, 数字, 字母, 字符至少包含两种, 同时不能包含中文和空格
      let reg = /[0-9a-zA-Z]{5,20}$/
      if (!reg.test(value)) {
        callback(new Error('密码长度需5-20位，只能包含字母或字符'))
      } else {
        callback()
      }
    }
    // 验证密码是否重复
    let validatePass2 = (rule, value, callback) => {
      if (value !== this.regForm.pwd) {
        callback(new Error('两次密码输入不一致'))
      } else {
        callback()
      }
    }
    return {
      modal: false,
      session: 'login',
      loginForm: {
        uid: '',
        pwd: ''
      },
      registerForm: {
        uid: '',
        nick: '',
        pwd: '',
        checkPwd: ''
      },
      loginRules: {
        uid: [
          { required: true, message: '用户名不能少', trigger: 'change' },
          { min: 5, max: 20, message: '用户名在5到20位之间', trigger: 'change' }
        ],
        pwd: [
          { required: true, message: '请输入密码', trigger: 'change' }
        ]
      },
      registerRules: {
        uid: [
          { required: true, message: '用户名不能少', trigger: 'change' },
          { min: 5, max: 20, message: '用户名在5到20位之间', trigger: 'change' }
        ],
        nick: [
          { required: true, message: '昵称不能少', trigger: 'change' }
        ],
        pwd: [
          { required: true, message: '请输入密码', trigger: 'change' },
          { validator: validatePass1, trigger: 'change' }
        ],
        checkPwd: [
          { required: true, message: '请再次输入密码', trigger: 'change' },
          { validator: validatePass2, trigger: 'change' }
        ]
      }
    }
  },
  methods: {
    routerTo (name) {
      this.$router.push({ name: name })
    },
    showDialog () {
      this.modal = true
    },
    submitForm () {
      if (this.session === 'login') {
        this.$refs['loginForm'].validate((valid) => {
          if (valid) { // 验证通过
            this.$Message.info('Login!')
          } else {
            // 验证不通过
            this.$Message.error('This is an error tip')
            return false
          }
        })
      } else {
        this.$refs['registerForm'].validate((valid) => {
          if (valid) { // 验证通过
            this.$Message.info('Register!')
          } else {
            // 验证不通过
            this.$Message.error('This is an error tip')
            return false
          }
        })
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
.ivu-tabs-nav-container
  font-size: 16px
.ivu-tabs-nav
  .ivu-tabs-tab
    padding: 8px 16px 12px 16px
.ivu-form-item
  margin-right: 20px
.loginuid
  margin-top: 60px
  margin-bottom: 30px
</style>
