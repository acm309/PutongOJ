<script setup>
import { useDiscussStore } from '@/store/modules/discuss'
import { useSessionStore } from '@/store/modules/session'
import { timeagoPretty } from '@/util/formate'
import { storeToRefs } from 'pinia'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

/**
 * @TODO add pagination
 */

const { t } = useI18n()
const sessionStore = useSessionStore()
const discussStore = useDiscussStore()
const router = useRouter()
const $Message = inject('$Message')
const $Modal = inject('$Modal')

const form = $ref({
  content: '',
  title: '',
})
let loading = $ref(false)

const { isLogined, isRoot } = $(storeToRefs(sessionStore))
const { list } = $(storeToRefs(discussStore))
const { find: fetch, create, delete: remove } = discussStore

async function createNew () {
  if (!form.title || !form.content) {
    $Message.warning('Title or Content can not be empty')
    return
  }
  loading = true
  try {
    const { did } = await create(form)
    $Message.success(`Create new thread ${did} success!`)
    router.push({
      name: 'discussInfo',
      params: { did },
    })
  } finally {
    loading = false
  }
}

function del (did) {
  $Modal.confirm({
    title: '提示',
    content: '<p>此操作将永久删除该帖子，是否继续？</p>',
    onOk: async () => {
      remove({ did })
      $Message.success(`成功删除 ${did}！`)
    },
    onCancel: () => {
      $Message.info('已取消删除！')
    },
  })
}

fetch()
</script>

<template>
  <div class="discuss-wrap">
    <div class="submit-discuss">
      <h3>{{ t('oj.create_new_thread') }}</h3>
      <Form :model="form" label-position="right" :label-width="70" class="form">
        <FormItem :label="t('oj.title')">
          <Input v-model="form.title" />
        </FormItem>
        <FormItem :label="t('oj.content')">
          <Input v-model="form.content" type="textarea" :autosize="{ minRows: 2, maxRows: 20 }" />
        </FormItem>
        <FormItem>
          <Button type="primary" :loading="loading" :disabled="!isLogined" @click="createNew">
            {{ isLogined ? t('oj.submit') : t('oj.login_to_reply') }}
          </Button>
        </FormItem>
      </Form>
    </div>
    <table class="discuss-table">
      <thead>
        <tr>
          <th class="discuss-id">
            #
          </th>
          <th class="discuss-title">
            {{ t('oj.title') }}
          </th>
          <th class="discuss-author">
            Author
          </th>
          <th class="discuss-updated">
            Updated
          </th>
          <th v-if="isRoot" class="discuss-action">
            {{ t('oj.action') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="list.length === 0" class="discuss-empty">
          <td :colspan="isRoot ? 5 : 4">
            <Icon type="ios-planet-outline" class="empty-icon" />
            <span class="empty-text">{{ t('oj.empty_content') }}</span>
          </td>
        </tr>
        <tr v-for="item in list" :key="item.did">
          <td class="discuss-id">
            {{ item.did }}
          </td>
          <td class="discuss-title">
            <router-link :to="{ name: 'discussInfo', params: { did: item.did } }">
              {{ item.title }}
            </router-link>
          </td>
          <td class="discuss-author">
            <router-link :to="{ name: 'userProfile', params: { uid: item.uid } }">
              {{ item.uid }}
            </router-link>
          </td>
          <td class="discuss-updated">
            {{ timeagoPretty(item.update) }}
          </td>
          <td v-if="isRoot" class="discuss-action">
            <Button type="text" @click="del(item.did)">
              {{ t('oj.delete') }}
            </Button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="stylus" scoped>
@import '../../styles/common'

.discuss-wrap
  max-width: 1024px
  margin 0 auto
  padding 10px 0

.submit-discuss
  padding 10px 40px

@media screen and (max-width: 1024px)
  .submit-discuss
    padding 0 20px

h3
  margin-top 20px
.form
  margin-top 2em

.discuss-table
  margin-bottom 20px
  th, td
    padding 0 16px
  tbody tr
    transition background-color 0.2s ease
    &:hover
      background-color #f7f7f7

.discuss-empty
  &:hover
    background-color transparent !important
  td
    margin-bottom 20px
    padding 32px !important
    border-radius 4px
    text-align center
    .empty-icon
      display block
      font-size 32px

.discuss-id
  width 80px
  text-align right
.discuss-action
  width 90px
  text-align left
</style>
