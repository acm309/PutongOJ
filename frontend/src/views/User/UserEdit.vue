<script setup>
import only from 'only'
import { storeToRefs } from 'pinia'
import { Button, Divider, Form, FormItem, Input, Radio, RadioGroup, Spin } from 'view-ui-plus'
import { inject } from 'vue'

import { useI18n } from 'vue-i18n'
import { useRootStore } from '@/store'
import { useSessionStore } from '@/store/modules/session'
import { useUserStore } from '@/store/modules/user'

const { t, locale } = useI18n()
const isZH = $computed(() => locale.value === 'zh-CN')

const rootStore = useRootStore()
const sessionStore = useSessionStore()
const userStore = useUserStore()

const message = inject('$Message')
const { update } = userStore
const { logout } = sessionStore
const { privilege } = $(storeToRefs(rootStore))
const { isRoot, isAdmin, profile } = $(storeToRefs(sessionStore))
const { user } = $(storeToRefs(userStore))

let loading = $ref(false)

const userInfoForm = $ref(null)
const userSecurityForm = $ref(null)
const isSelf = $computed(() => profile?.uid === user.uid)
const securityForm = $ref({
  oldPwd: '',
  newPwd: '',
  checkPwd: '',
})

const userInfoValidate = {
  uid: [ { required: true, trigger: 'blur' } ],
  nick: [ { type: 'string', max: 30, trigger: 'change' } ],
  motto: [ { type: 'string', max: 300, trigger: 'change' } ],
  mail: [ { type: 'email', trigger: 'change' } ],
  school: [ { type: 'string', max: 30, trigger: 'change' } ],
}

function checkPwdValidator (rule, value, callback) {
  const error = value !== securityForm.newPwd ? new Error(t('oj.password_not_match')) : null
  if (error) { callback(error) } else { callback() }
}

const userSecurityValidate = $computed(() => ({
  oldPwd: [ { required: !isAdmin, message: t('oj.password_missing'), trigger: 'change' } ],
  newPwd: [
    { required: true, message: t('oj.password_missing'), trigger: 'change' },
    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, message: t('oj.password_requirement'), trigger: 'change' },
  ],
  checkPwd: [
    { required: true, message: t('oj.password_confirm_missing'), trigger: 'change' },
    { validator: checkPwdValidator, trigger: 'change' },
  ],
}))

const privilegeOptions = [
  { label: 'Banned', value: privilege.Banned },
  { label: 'User', value: privilege.User },
  { label: 'Admin', value: privilege.Admin },
  { label: 'Root', value: privilege.Root },
]

function updateProfile () {
  const submit = async (valid) => {
    if (!valid) return
    loading = true
    const updatedUser = only(user, 'uid nick motto mail school')
    if (isRoot) updatedUser.privilege = user.privilege
    const response = await update(updatedUser)
    if (!response.isAxiosError) {
      message.success(t('oj.update_success'))
    }
    loading = false
  }
  userInfoForm.validate(submit)
}

async function updatePassword () {
  const submit = async (valid) => {
    if (!valid) return
    loading = true
    const response = await update({
      uid: user.uid,
      oldPwd: securityForm.oldPwd,
      newPwd: securityForm.newPwd,
    })
    if (!response.isAxiosError) {
      securityForm.oldPwd = ''
      securityForm.newPwd = ''
      securityForm.checkPwd = ''
      message.success(t('oj.update_success'))
      if (isSelf) {
        logout().then(() => message.info(t('oj.please_relogin')))
      }
    }
    loading = false
  }
  userSecurityForm.validate(submit)
}
</script>

<template>
  <div class="user-edit">
    <Form ref="userInfoForm" :label-width="isZH ? 80 : 130" :rules="userInfoValidate" :model="user">
      <FormItem :label="t('oj.username')" prop="uid">
        <Input v-model="user.uid" disabled />
      </FormItem>
      <FormItem :label="t('oj.nick')" prop="nick">
        <Input v-model="user.nick" :maxlength="30" show-word-limit />
      </FormItem>
      <FormItem :label="t('oj.motto')" prop="motto">
        <Input
          v-model="user.motto" type="textarea" maxlength="300" show-word-limit
          :autosize="{ minRows: 3, maxRows: 10 }"
        />
      </FormItem>
      <FormItem :label="t('oj.mail')" prop="mail">
        <Input v-model="user.mail" maxlength="254" />
      </FormItem>
      <FormItem :label="t('oj.school')" prop="school">
        <Input v-model="user.school" maxlength="30" show-word-limit />
      </FormItem>
      <FormItem v-if="isRoot" :label="t('oj.privilege')">
        <RadioGroup v-model="user.privilege">
          <Radio v-for="item in privilegeOptions" :key="item.value" :label="item.value" :disabled="isSelf" border>
            {{ item.label }}
          </Radio>
        </RadioGroup>
      </FormItem>
      <FormItem>
        <Button type="primary" size="large" @click="updateProfile">
          {{ t('oj.submit') }}
        </Button>
      </FormItem>
    </Form>
    <Form ref="userSecurityForm" :label-width="isZH ? 80 : 130" :rules="userSecurityValidate" :model="securityForm">
      <Divider simple class="user-divider">
        {{ t('oj.security') }}
      </Divider>
      <FormItem v-if="!isAdmin" :label="t('oj.password_old')" prop="oldPwd">
        <Input v-model="securityForm.oldPwd" type="password" :placeholder="t('oj.leave_it_blank_if_no_change')" />
      </FormItem>
      <FormItem :label="t('oj.password_new')" prop="newPwd">
        <Input v-model="securityForm.newPwd" type="password" :placeholder="t('oj.leave_it_blank_if_no_change')" />
      </FormItem>
      <FormItem :label="t('oj.password_confirm')" prop="checkPwd">
        <Input v-model="securityForm.checkPwd" type="password" :placeholder="t('oj.leave_it_blank_if_no_change')" />
      </FormItem>
      <FormItem>
        <Button type="primary" size="large" @click="updatePassword">
          {{ t('oj.submit') }}
        </Button>
      </FormItem>
    </Form>
    <Spin size="large" fix :show="loading" />
  </div>
</template>

<style lang="stylus">
.user-wrap .ivu-radio-group-button .ivu-radio-wrapper-checked:before
  background transparent !important
</style>

<style lang="stylus" scoped>
.user-edit
  padding 40px
  position relative

.user-divider
  margin 40px 0 !important

@media screen and (max-width: 1024px)
  .user-edit
    padding 20px
  .user-divider
    margin 20px 0 !important
</style>
