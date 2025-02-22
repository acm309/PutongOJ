<script setup>
import only from 'only'
import { storeToRefs } from 'pinia'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

import { Button, Divider, Form, FormItem, Input, Radio, RadioGroup, Spin } from 'view-ui-plus'
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
let oldPwd = $ref('')
let newPwd = $ref('')
let checkPwd = $ref('')

const userForm = $ref(null)
const isSelf = $computed(() => profile?.uid === user.uid)

const ruleValidate = {
  uid: [ { required: true, trigger: 'blur' } ],
  nick: [ { type: 'string', max: 20, trigger: 'change' } ],
  motto: [ { type: 'string', max: 100, trigger: 'change' } ],
  mail: [ { type: 'email', trigger: 'change' } ],
  school: [ { type: 'string', max: 20, trigger: 'change' } ],
}

const privilegeOptions = [
  { label: 'Banned', value: privilege.Banned, disabled: true },
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
  userForm.validate(submit)
}

async function updatePassword () {
  if ((!isAdmin && !oldPwd) || !newPwd) {
    message.error(t('oj.password_missing'))
    return
  }
  if (!checkPwd) {
    message.error(t('oj.password_confirm_missing'))
    return
  }
  if (newPwd !== checkPwd) {
    message.error(t('oj.password_not_match'))
    return
  }
  loading = true
  const response = await update({ uid: user.uid, oldPwd, newPwd })
  if (!response.isAxiosError) {
    oldPwd = ''
    newPwd = ''
    checkPwd = ''
    message.success(t('oj.update_success'))
    if (isSelf) {
      logout().then(() => message.info(t('oj.please_relogin')))
    }
  }
  loading = false
}
</script>

<template>
  <div class="user-edit">
    <Form ref="userForm" :label-width="isZH ? 80 : 130" :rules="ruleValidate" :model="user">
      <FormItem :label="t('oj.username')" prop="uid">
        <Input v-model="user.uid" disabled />
      </FormItem>
      <FormItem :label="t('oj.nick')" prop="nick">
        <Input v-model="user.nick" :maxlength="20" show-word-limit />
      </FormItem>
      <FormItem :label="t('oj.motto')" prop="motto">
        <Input
          v-model="user.motto" type="textarea" maxlength="100" show-word-limit
          :autosize="{ minRows: 2, maxRows: 5 }"
        />
      </FormItem>
      <FormItem :label="t('oj.mail')" prop="mail">
        <Input v-model="user.mail" maxlength="254" />
      </FormItem>
      <FormItem :label="t('oj.school')" prop="school">
        <Input v-model="user.school" maxlength="20" show-word-limit />
      </FormItem>
      <FormItem v-if="isRoot" :label="t('oj.privilege')">
        <RadioGroup v-model="user.privilege">
          <Radio
            v-for="item in privilegeOptions" :key="item.value" :label="item.value"
            :disabled="item.disabled || isSelf" border
          >
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
    <Form :label-width="isZH ? 80 : 130">
      <Divider simple class="user-divider">
        {{ t('oj.security') }}
      </Divider>
      <FormItem v-if="!isAdmin" :label="t('oj.password_old')">
        <Input v-model="oldPwd" type="password" :placeholder="t('oj.leave_it_blank_if_no_change')" />
      </FormItem>
      <FormItem :label="t('oj.password_new')">
        <Input v-model="newPwd" type="password" :placeholder="t('oj.leave_it_blank_if_no_change')" />
      </FormItem>
      <FormItem :label="t('oj.password_confirm')">
        <Input v-model="checkPwd" type="password" :placeholder="t('oj.leave_it_blank_if_no_change')" />
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
