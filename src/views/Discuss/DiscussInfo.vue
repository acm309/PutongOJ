<script setup>
import { storeToRefs } from 'pinia'
import { toRefs } from 'vue'
import { useSessionStore } from '@/store/modules/session'
import { useDiscussStore } from '@/store/modules/discuss'
import { timeagoPretty } from '@/util/formate'

const props = defineProps([ 'did' ])
const { did } = $(toRefs(props))

const sessionStore = useSessionStore()
const discussStore = useDiscussStore()
let loading = $ref(false)
const form = $ref({
  form: {
    content: '',
  },
})

const { isLogined } = $(storeToRefs(sessionStore))
const { discuss } = $(storeToRefs(discussStore))
const { findOne, update } = discussStore

const fetch = () => findOne({ did })

async function createNew () {
  loading = true
  try {
    await update({
      did,
      content: form.content,
    })
    form.content = ''
    fetch()
  } finally {
    loading = false
  }
}

fetch()
</script>

<template>
  <div class="discuss-wrap">
    <h1>{{ discuss.title }}</h1>
    <Card v-for="comment in discuss.comments" :key="comment.content" dis-hover>
      <template #title>
        <p>{{ comment.uid }}</p>
      </template>
      <template #extra>
        <span>
          {{ timeagoPretty(comment.create) }}
        </span>
      </template>
      <pre><code>{{ comment.content }}</code></pre>
    </Card>
    <br>
    <Form :model="form" label-position="top" class="form">
      <FormItem>
        <Input v-model="form.content" type="textarea" :autosize="{ minRows: 2, maxRows: 20 }" />
      </FormItem>
      <FormItem>
        <Button
          type="primary"
          :loading="loading"
          :disabled="!isLogined"
          @click="createNew"
        >
          Add a reply
        </Button>
        <span v-if="!isLogined">Login to reply</span>
      </FormItem>
    </Form>
    <span>You will receive notifications through your email, if anyone replies</span>
  </div>
</template>

<style lang="stylus">
.discuss-wrap
  .ivu-card-body
    padding: 0 16px
  .ivu-card
    margin-top: 1em
    &:first-child
      margin-top: 0.1em
  .ivu-card-extra
    top: 4px
  .ivu-card-head
    padding: 4px 16px
</style>
