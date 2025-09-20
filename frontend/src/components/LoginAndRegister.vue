<script lang="ts" setup>
import type { OAuthAction, OAuthProvider } from '@backend/services/oauth'
import type { Message } from 'view-ui-plus'
import type { Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Button, Divider, Form, FormItem, Input, Modal, Title } from 'view-ui-plus'
import { computed, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import { useRootStore } from '@/store'
import { useSessionStore } from '@/store/modules/session'
import { useUserStore } from '@/store/modules/user'
import { encryptData } from '@/utils/crypto'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const rootStore = useRootStore()
const sessionStore = useSessionStore()
const userStore = useUserStore()
const { register } = userStore
const { userLogin, toggleLoginState: toggleModal } = sessionStore
const { website } = storeToRefs(rootStore)
const modalOpen = computed(() => sessionStore.loginDialog)
const message = inject('$Message') as typeof Message

const loginForm = ref(null) as Ref<any>
const registerForm = ref(null) as Ref<any>

enum TabType {
  login = 'login',
  register = 'register',
}
const tab = ref(TabType.login)

const form = ref({
  uid: '',
  pwd: '',
  checkPwd: '',
})

function checkPwdValidator (_: any, value: string, callback: (error?: Error) => void) {
  const error = value !== form.value.pwd ? new Error(t('oj.password_not_match')) : null
  if (error) { callback(error) } else { callback() }
}

const basicRules = computed(() => ({
  uid: [ { required: true, message: t('oj.username_missing'), trigger: 'change' } ],
  pwd: [ { required: true, message: t('oj.password_missing'), trigger: 'change' } ],
}))

const loginRules = basicRules
const registerRules = computed(() => ({
  uid: [
    ...basicRules.value.uid,
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
  if (tab.value === TabType.login) {
    loginForm.value.validate(async (valid: boolean) => {
      if (!valid) {
        return
      }
      const result = await userLogin({
        uid: form.value.uid,
        pwd: await encryptData(form.value.pwd),
      })
      if (result.success) {
        message.success(`Welcome, ${form.value.uid}`)
        toggleModal()
        if (route.name === 'oauthCallback') {
          router.push({ name: 'userEdit', params: { uid: form.value.uid } })
        }
        form.value.pwd = ''
      } else {
        message.error(result.message)
      }
    })
  } else {
    registerForm.value.validate(async (valid: boolean) => {
      if (!valid) {
        return
      }
      const result = await register({
        uid: form.value.uid,
        pwd: await encryptData(form.value.pwd),
      })
      if (result.success) {
        tab.value = TabType.login
        submit()
      } else {
        message.error(result.message)
      }
    })
  }
}

async function usingOAuth (provider: Lowercase<OAuthProvider>) {
  const url = await api.oauth.generateOAuthUrl(provider, { action: 'login' as OAuthAction })
  window.open(url.data.url, '_self', 'noopener,noreferrer')
}
</script>

<template>
  <Modal v-model="modalOpen" :footer-hide="true" @on-cancel="toggleModal">
    <div class="modal-form">
      <div class="modal-header">
        <Title :level="2">
          {{ tab === TabType.login ? t('oj.login') : t('oj.register') }}
        </Title>
      </div>
      <div v-show="tab === TabType.login">
        <Form ref="loginForm" :model="form" :rules="loginRules" label-position="top">
          <div v-if="Object.values(website.oauthEnabled).includes(true)">
            <FormItem v-if="website.oauthEnabled.CJLU">
              <Button size="large" long @click="usingOAuth('cjlu')">
                中国计量大学统一身份认证
              </Button>
            </FormItem>
            <Divider>OR</Divider>
          </div>
          <FormItem :label="t('oj.username')" prop="uid">
            <Input v-model="form.uid" prefix="ios-contact-outline" size="large" />
          </FormItem>
          <FormItem :label="t('oj.password')" prop="pwd">
            <Input
              v-model="form.pwd" prefix="ios-lock-outline" type="password" password size="large"
              @keyup.enter="submit"
            />
          </FormItem>
          <FormItem>
            <Button type="primary" size="large" long @click="submit">
              {{ t('oj.login') }}
            </Button>
          </FormItem>
          <FormItem>
            <Button size="large" long @click="tab = TabType.register">
              {{ t('oj.register') }}
            </Button>
          </FormItem>
        </Form>
      </div>
      <div v-show="tab === TabType.register">
        <Form ref="registerForm" :model="form" :rules="registerRules" label-position="top">
          <FormItem :label="t('oj.username')" prop="uid">
            <Input
              v-model="form.uid" :placeholder="t('oj.username_description')" prefix="ios-contact-outline"
              size="large"
            />
          </FormItem>
          <FormItem :label="t('oj.password')" prop="pwd">
            <Input v-model="form.pwd" prefix="ios-lock-outline" type="password" password size="large" />
          </FormItem>
          <FormItem :label="t('oj.password_confirm')" prop="checkPwd">
            <Input v-model="form.checkPwd" prefix="ios-lock-outline" type="password" password size="large" />
          </FormItem>
          <FormItem>
            <Button type="primary" size="large" long @click="submit">
              {{ t('oj.register') }}
            </Button>
          </FormItem>
          <FormItem>
            <Button size="large" long @click="tab = TabType.login">
              {{ t('oj.login') }}
            </Button>
          </FormItem>
        </Form>
      </div>
    </div>
  </Modal>
</template>

<style lang="stylus" scoped>
.modal-form
  padding 32px 32px 8px
.modal-header
  margin-bottom 48px
  text-align center
</style>
