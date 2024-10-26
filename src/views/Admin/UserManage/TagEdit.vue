<script setup>
import { storeToRefs } from 'pinia'
import { inject } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProblemStore } from '@/store/modules/problem'
import { useTagStore } from '@/store/modules/tag'

const { t } = useI18n()
const problemStore = useProblemStore()
const tagStore = useTagStore()
const targetTagIdx = $ref(-1)
let targetKeys = $ref([])
const listStyle = $ref({
  width: '350px',
  height: '400px',
})
const newTid = $ref('')
const Spin = inject('$Spin')
const Message = inject('$Message')
const Modal = inject('$Modal')

const { list: problemSum } = $(storeToRefs(problemStore))
const { list: tagList, tag } = $(storeToRefs(tagStore))
const { clearSavedProblems } = problemStore
const {
  find,
  findOne,
  update,
  create,
  clearSavedTags,
  'delete': remove,
} = tagStore
const transData = $computed(() => problemSum.map(item => ({
  key: `${item.pid}`,
  label: `${item.pid} | ${item.title}`,
})))

onBeforeRouteLeave(() => {
  clearSavedProblems()
  clearSavedTags()
  targetKeys = []
})

async function fetchTag () {
  Spin.show()
  await Promise.all([ problemStore.find({ page: -1 }), tagStore.find() ])
  Spin.hide()
}

function handleChange (newTargetKeys) {
  targetKeys = newTargetKeys
}

async function manageTag (name) {
  if (name === 'search') {
    Spin.show()
    targetKeys = []
    try {
      await findOne({ tid: tagList[targetTagIdx].tid })
      targetKeys = tag.list.map(item => `${item}`)
    } finally {
      Spin.hide()
    }
  } else if (name === 'delete') {
    if (!tag || !tag.tid) {
      Message.info(t('oj.no_tag'))
    } else {
      Modal.confirm({
        title: t('oj.warning'),
        okText: t('oj.ok'),
        cancelText: t('oj.cancel'),
        content: `<p>${t('oj.will_remove_tag', tag)}</p>`,
        onOk: async () => {
          Spin.show()
          try {
            await remove({ tid: tag.tid })
            Message.success(t('oj.remove_tag_success', tag))
          } finally {
            Spin.hide()
          }
        },
        onCancel: () => Message.info(t('oj.cancel_remove')),
      })
    }
  }
}

async function saveTag () {
  const problems = targetKeys.slice()
  Spin.show()
  try {
    const tid = await update({
      tid: tagList[targetTagIdx].tid,
      list: problems,
    })
    Message.success(t('oj.update_tag_success', { tid }))
  } finally {
    Spin.hide()
  }
}

async function createTag () {
  const problems = targetKeys.slice()
  Spin.show()
  try {
    await create({ tid: newTid, list: problems })
    await find()
    Message.success(t('oj.create_tag_success', { tid: newTid }))
  } finally {
    Spin.hide()
  }
}

fetchTag()
</script>

<template>
  <div>
    <h1>{{ t('oj.manage_tag') }}</h1>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Title
      </Col>
      <Col :span="4">
        <Input v-model="newTid" />
      </Col>
      <Col offset="1" :span="6">
        <Button type="primary" :disabled="!newTid" @click="createTag">
          {{ t('oj.create') }}
        </Button>
        <!-- TODO: implement rename -->
        <!-- &nbsp;
        <Button type="primary" :disabled="!tag.tid" @click="saveTag">
          {{ t('oj.rename') }}
        </Button> -->
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Tag
      </Col>
      <Col :span="4">
        <Select v-model="targetTagIdx" filterable @on-select="manageTag('search')">
          <Option v-for="(item, index) in tagList" :key="item.tid" :value="index">
            {{ item.tid }}
          </Option>
        </Select>
      </Col>
      <Col offset="1" :span="6">
        <Button type="primary" :disabled="targetTagIdx !== -1" @click="manageTag('delete')">
          {{ t('oj.delete') }}
        </Button>
      </Col>
    </Row>

    <Transfer
      :data="transData" :target-keys="targetKeys" :list-style="listStyle" filterable class="tranfer"
      @on-change="handleChange"
    />
    <Button type="primary" class="submit" @click="saveTag">
      {{ t('oj.submit') }}
    </Button>
  </div>
</template>

<style lang="stylus" scoped>
.ivu-col-offset-1
  margin-left: 1%
.tranfer
  margin-top: 20px
  margin-bottom: 20px
.ivu-tag
  height: 28px
  line-height: 26px
</style>
