<template>
  <Modal :value="visible" @on-cancel="triggerLogin" :closable="false">
    <Tabs v-model="mode">
      <TabPane label="Login" name="login">
        <Form ref="loginForm" :model="form" :rules="loginRules" :label-width="100">
          <FormItem class="loginuid" label="Username" prop="uid">
            <Input v-model="form.uid"></Input>
          </FormItem>
          <FormItem class="loginpwd" label="Password" prop="pwd">
            <Input v-model="form.pwd" type="password" @keyup.enter.native="submit"></Input>
          </FormItem>
        </Form>
      </TabPane>
      <TabPane label="Register" name="register">
        <Form ref="registerForm" :model="form" :rules="registerRules" :label-width="100">
          <FormItem label="Username" prop="uid">
            <Input v-model="form.uid"></Input>
          </FormItem>
          <FormItem label="Nickname" prop="nick">
            <Input v-model="form.nick"></Input>
          </FormItem>
          <FormItem label="Password" prop="pwd">
            <Input v-model="form.pwd" type="password"></Input>
          </FormItem>
          <FormItem label="CheckPwd" prop="checkPwd" class="checkpwd">
            <Input v-model="form.checkPwd" type="password"></Input>
          </FormItem>
        </Form>
      </TabPane>
    </Tabs>
    <div slot="footer">
      <Row type="flex" justify="center">
        <Col :span="20">
          <Button type="primary" size="large" long @click="submit">Submit</Button>
        </Col>
      </Row>
    </div>
  </Modal>
</template>
<script>
import { mapState, mapActions as MA, mapMutations } from 'vuex'
import { mapActions } from 'pinia'
import { TRIGGER_LOGIN } from '@/store/types'
import { useUserStore } from '@/store/modules/user'
import only from 'only'

export default {
  data () {
    // 自定义验证规则
    const validatePass1 = (rule, value, callback) => {
      // 5-50位, 数字, 字母, 字符至少包含两种, 同时不能包含中文和空格
      const error = !/[0-9a-zA-Z]{5,50}$/.test(value)
        ? new Error('密码长度需5-50位，只能包含字母和数字') : null
      error ? callback(error) : callback()
    }
    // 验证密码是否重复
    const validatePass2 = (rule, value, callback) => {
      const error = value !== this.form.pwd ? new Error('两次密码输入不一致') : null
      error ? callback(error) : callback()
    }
    const basicRules = {
      uid: [
        { required: true, message: '用户名不能少', trigger: 'change' },
        { min: 5, max: 50, message: '用户名在 5 到 50 位之间', trigger: 'change' }
      ],
      pwd: [
        { required: true, message: '请输入密码', trigger: 'change' }
      ]
    }
    return {
      mode: 'login',
      form: {
        uid: '',
        pwd: '',
        nick: '',
        checkPwd: ''
      },
      loginRules: basicRules,
      registerRules: {
        uid: basicRules.uid.concat({
          required: true,
          type: 'string',
          pattern: /^\w+$/ig,
          message: '用户名只能包含字母和数字',
          trigger: 'change'
        }),
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
  computed: {
    ...mapState('session', {
      visible: state => state.loginDialog
    })
  },
  methods: {
    ...mapMutations('session', {
      triggerLogin: TRIGGER_LOGIN
    }),
    ...MA({
      login: 'session/login'
    }),
    ...mapActions(useUserStore, ['register']),
    submit () {
      if (this.mode === 'login') {
        this.$refs['loginForm'].validate((valid) => {
          if (valid) { // 验证通过
            this.login(only(this.form, 'uid pwd'))
              .then(() => {
                this.$Message.success(`Welcome, ${this.form.uid} !`)
                this.triggerLogin()
              })
          }
        })
      } else {
        this.$refs['registerForm'].validate((valid) => {
          if (valid) { // 验证通过
            this.register(this.form)
              .then(() => {
                // 注册好后，自动登录
                this.mode = 'login'
                this.submit()
              })
          }
        })
      }
    }
  }
}
</script>
<style lang="stylus" scoped>
.ivu-tabs-nav-container
  font-size: 16px
.ivu-tabs-nav
  .ivu-tabs-tab
    padding: 8px 16px 12px 16px
.ivu-form-item
  margin-right: 20px
.checkpwd
  margin-bottom: 5px
.loginuid
  margin-top: 56px
  margin-bottom: 30px
</style>
