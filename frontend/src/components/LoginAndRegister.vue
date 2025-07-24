<script setup>
import only from 'only'
import { inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/store/modules/session'
import { useUserStore } from '@/store/modules/user'

const { t } = useI18n()

let mode = $ref('login')
const form = $ref({
  uid: '',
  pwd: '',
  nick: '',
  checkPwd: '',
})

function checkPwdValidator (rule, value, callback) {
  const error = value !== form.pwd ? new Error(t('oj.password_not_match')) : null
  if (error) { callback(error) } else { callback() }
}

const basicRules = $computed(() => ({
  uid: [ { required: true, message: t('oj.username_missing'), trigger: 'change' } ],
  pwd: [ { required: true, message: t('oj.password_missing'), trigger: 'change' } ],
}))

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
const registerRules = $computed(() => ({
  uid: [
    ...basicRules.uid,
    { min: 3, max: 20, message: t('oj.username_length_requirement'), trigger: 'change' },
    { required: true, type: 'string', pattern: /^[\w-]+$/, message: t('oj.username_char_requirement'), trigger: 'change' },
  ],
  pwd: [
    { required: true, message: t('oj.password_missing'), trigger: 'change' },
    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, message: t('oj.password_requirement'), trigger: 'change' },
  ],
  checkPwd: [
    { required: true, message: t('oj.password_confirm_missing'), trigger: 'change' },
    { validator: checkPwdValidator, trigger: 'change' },
  ],
}))

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
      <TabPane :label="t('oj.login')" name="login">
        <Form ref="loginForm" :model="form" :rules="loginRules" :label-width="100" class="login-form">
          <FormItem :label="t('oj.username')" prop="uid">
            <Input v-model="form.uid" />
          </FormItem>
          <FormItem :label="t('oj.password')" prop="pwd">
            <Input v-model="form.pwd" type="password" @keyup.enter="submit" />
          </FormItem>
        </Form>
      </TabPane>
      <TabPane :label="t('oj.register')" name="register">
        <Form ref="registerForm" :model="form" :rules="registerRules" :label-width="100" class="register-form">
          <FormItem :label="t('oj.username')" prop="uid">
            <Input v-model="form.uid" :placeholder="t('oj.username_description')" />
          </FormItem>
          <FormItem :label="t('oj.nick')" prop="nick">
            <Input v-model="form.nick" />
          </FormItem>
          <FormItem :label="t('oj.password')" prop="pwd">
            <Input v-model="form.pwd" type="password" />
          </FormItem>
          <FormItem :label="t('oj.password_confirm')" prop="checkPwd">
            <Input v-model="form.checkPwd" type="password" />
          </FormItem>
        </Form>
      </TabPane>
    </Tabs>
    <template #footer>
      <Row type="flex" justify="center">
        <Col :span="20">
          <Button type="primary" size="large" long @click="submit">
            {{ t('oj.submit') }}
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
.login-form
  padding-top 82px
.register-form
  padding-top 24px
</style>
