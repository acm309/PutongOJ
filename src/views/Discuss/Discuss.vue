<script setup>
// TODO: add pagination
import { storeToRefs } from 'pinia'
import { inject } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/store/modules/session'
import { useDiscussStore } from '@/store/modules/discuss'
import { timeagoPretty } from '@/util/formate'

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

const { isLogined, isAdmin, canRemove } = $(storeToRefs(sessionStore))
const { list } = $(storeToRefs(discussStore))
const { find, create, 'delete': remove } = discussStore

const fetch = () => find()

async function createNew () {
  if (!form.title || !form.content) {
    $Message.warning('Title or Content can not be empty')
    return
  }
  loading = true
  try {
    const { did } = await create(form)
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
    content: '<p>此操作将永久删除该文件, 是否继续?</p>',
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
  <div>
    <table>
      <tr>
        <th>Did</th>
        <th>Title</th>
        <th>Author</th>
        <th>Updated</th>
        <th v-if="isAdmin && canRemove">
          Action
        </th>
      </tr>
      <template v-for="item in list" :key="item.did">
        <tr>
          <td>
            {{ item.did }}
          </td>
          <td>
            <router-link :to="{ name: 'discussInfo', params: { did: item.did } }">
              <Button type="text">
                {{ item.title }}
              </Button>
            </router-link>
          </td>
          <td>
            <router-link :to="{ name: 'userInfo', params: { uid: item.uid } }">
              <Button type="text">
                {{ item.uid }}
              </Button>
            </router-link>
          </td>
          <td>
            {{ timeagoPretty(item.update) }}
          </td>
          <td v-if="isAdmin && canRemove">
            <Button type="text" @click="del(item.did)">
              {{ t('oj.delete') }}
            </Button>
          </td>
        </tr>
      </template>
    </table>
    <h3>{{ t('oj.create_new_thread') }}</h3>
    <Form :model="form" label-position="right" :label-width="100" class="form">
      <FormItem :label="t('oj.title')">
        <Input v-model="form.title" />
      </FormItem>
      <FormItem :label="t('oj.content')">
        <Input v-model="form.content" type="textarea" :autosize="{ minRows: 2, maxRows: 20 }" />
      </FormItem>
      <FormItem>
        <Button type="primary" :loading="loading" :disabled="!isLogined" @click="createNew">
          {{ t('oj.submit') }}
        </Button>
        <span v-if="!isLogined">{{ t('oj.login_to_reply') }}</span>
      </FormItem>
    </Form>
  </div>
</template>

<style lang="stylus" scoped>
h3
  margin-top: 20px
.form
  margin-top: 2em
</style>
