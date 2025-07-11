<script setup>
import { storeToRefs } from 'pinia'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store/modules/user'
import { purify } from '@/util/helper'

const { t } = useI18n()
const userStore = useUserStore()
const { user } = $(storeToRefs(userStore))
const uid = $ref('')
const newPwd = $ref('')
const checkPwd = $ref('')
const Message = inject('$Message')

const findUser = () => userStore.findOne({ uid })

async function saveUser () {
  if (newPwd === checkPwd) {
    const newUser = purify(Object.assign(
      user,
      { newPwd },
    ))
    await userStore.update(newUser)
    Message.success(t('oj.update_success'))
  } else {
    Message.info(t('oj.password_not_match'))
  }
}
</script>

<template>
  <div class="usermanage">
    <h1>{{ t('oj.edit_user') }}</h1>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        {{ t('oj.username') }}
      </Col>
      <Col :span="4">
        <Input v-model="uid" />
      </Col>
      <Col :offset="1" :span="2">
        <Button type="primary" @click="findUser">
          {{ t('oj.search') }}
        </Button>
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        {{ t('oj.nick') }}
      </Col>
      <Col :span="21">
        <Input v-model="user.nick" />
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        {{ t('oj.motto') }}
      </Col>
      <Col :span="21">
        <Input v-model="user.motto" />
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        {{ t('oj.school') }}
      </Col>
      <Col :span="21">
        <Input v-model="user.school" />
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        {{ t('oj.password') }}
      </Col>
      <Col :span="21">
        <Input v-model="newPwd" type="password" :placeholder="t('oj.leave_it_blank_if_no_change')" />
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        {{ t('oj.password_confirm') }}
      </Col>
      <Col :span="21">
        <Input v-model="checkPwd" type="password" :placeholder="t('oj.leave_it_blank_if_no_change')" />
      </Col>
    </Row>
    <Button
      type="primary" class="submit" :disabled="user.uid == null"
      @click="saveUser"
    >
      {{ t('oj.submit') }}
    </Button>
    <p v-if="user.uid == null">
      Click search to find user first
    </p>
  </div>
</template>

<style lang="stylus" scoped>
.ivu-col-offset-1
  margin-left: 1%
.usermanage
  h1
    margin-bottom: 20px
  .ivu-row-flex
    margin-bottom: 10px
  .label
    line-height: 32px
  .submit
    margin-bottom: 20px
</style>
