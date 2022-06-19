<script setup>
import { mapState, storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { purify } from '@/util/helper'
import { useUserStore } from '@/store/modules/user'

const { t } = useI18n()
const userStore = useUserStore()
const { user } = $(storeToRefs(userStore))
const uid = $ref('')
const newPwd = $ref('')
const checkPwd = $ref('')

// export default {
//   data: () => ({
//     uid: '',
//     newPwd: '',
//     checkPwd: '',
//   }),
//   computed: {
//     ...mapState(useUserStore, [ 'user' ]),
//   },
//   created () {
//   },
//   methods: {
//     findUser () {
//       useUserStore().findOne({ uid: this.uid })
//     },
//     saveUser () {
//       if (this.newPwd === this.checkPwd) {
//         const user = purify(Object.assign(
//           this.user,
//           { newPwd: this.newPwd },
//         ))
//         useUserStore().update(user).then(() => {
//           this.$Message.success('修改成功！')
//         })
//       } else {
//         this.$Message.info('两次密码不一致，请重新输入！')
//       }
//     },
//   },
// }
</script>

<template>
  <div>
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
    <Button type="primary" class="submit" @click="saveUser">
      {{ t('oj.submit') }}
    </Button>
  </div>
</template>

<style lang="stylus" scoped>
.ivu-col-offset-1
  margin-left: 1%
</style>
