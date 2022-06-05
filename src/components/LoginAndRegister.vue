<script setup>
import only from 'only'
import { inject, ref } from 'vue'
import { useSessionStore } from '@/store/modules/session'
import { useUserStore } from '@/store/modules/user'

const validatePass1 = (rule, value, callback) => {
  // 5-50位, 数字, 字母, 字符至少包含两种, 同时不能包含中文和空格
  const error = !/[0-9a-zA-Z]{5,50}$/.test(value)
    ? new Error('密码长度需5-50位，只能包含字母和数字')
    : null
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
    { min: 4, max: 50, message: '用户名在 4 到 50 位之间', trigger: 'change' },
  ],
  pwd: [
    { required: true, message: '请输入密码', trigger: 'change' },
  ],
}

let mode = $ref('login')
const form = $ref({
  uid: '', pwd: '', nick: '', checkPwd: '',
})
const sessionStore = useSessionStore()
const userStore = useUserStore()
const visible = $computed(() => sessionStore.loginDialog)
const triggerLogin = sessionStore.toggleLoginState
const { register } = userStore
const { login } = sessionStore
const loginForm = ref(null)
const registerForm = ref(null)
const $Message = inject('$Message')

const loginRules = basicRules
const registerRules = {
  uid: basicRules.uid.concat({
    required: true,
    type: 'string',
    pattern: /^\w+$/ig,
    message: '用户名只能包含字母和数字',
    trigger: 'change',
  }),
  pwd: [
    { required: true, message: '请输入密码', trigger: 'change' },
    { validator: validatePass1, trigger: 'change' },
  ],
  checkPwd: [
    { required: true, message: '请再次输入密码', trigger: 'change' },
    { validator: validatePass2, trigger: 'change' },
  ],
}

function submit () {
  if (mode === 'login') {
    loginForm.value.validate(async (valid) => {
      if (!valid) return
      await login(only(form, 'uid pwd'))
      $Message.success(`Welcome, ${form.uid} !`)
      triggerLogin()
    })
  } else {
    registerForm.value.validate(async (valid) => {
      if (!valid) return
      await register(form)
      mode = 'login'
      submit()
    })
  }
}
</script>

<template>
  <Modal v-model="visible" :closable="false" @on-cancel="triggerLogin">
    <Tabs v-model="mode">
      <TabPane label="Login" name="login">
        <Form ref="loginForm" :model="form" :rules="loginRules" :label-width="100">
          <FormItem class="loginuid" label="Username" prop="uid">
            <Input v-model="form.uid" />
          </FormItem>
          <FormItem class="loginpwd" label="Password" prop="pwd">
            <Input v-model="form.pwd" type="password" @keyup.enter="submit" />
          </FormItem>
        </Form>
      </TabPane>
      <TabPane label="Register" name="register">
        <Form ref="registerForm" :model="form" :rules="registerRules" :label-width="100">
          <FormItem label="Username" prop="uid">
            <Input v-model="form.uid" />
          </FormItem>
          <FormItem label="Nickname" prop="nick">
            <Input v-model="form.nick" />
          </FormItem>
          <FormItem label="Password" prop="pwd">
            <Input v-model="form.pwd" type="password" />
          </FormItem>
          <FormItem label="CheckPwd" prop="checkPwd" class="checkpwd">
            <Input v-model="form.checkPwd" type="password" />
          </FormItem>
        </Form>
      </TabPane>
    </Tabs>
    <template #footer>
      <Row type="flex" justify="center">
        <Col :span="20">
          <Button type="primary" size="large" long @click="submit">
            Submit
          </Button>
        </Col>
      </Row>
    </template>
  </Modal>
</template>

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
