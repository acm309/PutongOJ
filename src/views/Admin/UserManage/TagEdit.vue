<script setup>
import only from 'only'
import { storeToRefs } from 'pinia'
import { inject } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProblemStore } from '@/store/modules/problem'
import { useTagStore } from '@/store/modules/tag'

const { t } = useI18n()
const problemStore = useProblemStore()
const tagStore = useTagStore()
const ind = $ref(0)
let targetKeys = $ref([])
const listStyle = $ref({
  width: '350px',
  height: '400px',
})
let problemList = $ref([])
let operation = $ref('search')
let isNew = $ref(false)
const Spin = inject('$Spin')
const Message = inject('$Message')
const Modal = inject('$Modal')

const { list: problemSum } = $(storeToRefs(problemStore))
const { list: tagList, tag } = $(storeToRefs(tagStore))
const { clearSavedProblems } = problemStore
const {
  find, findOne, update, create, clearSavedTags,
  'delete': remove,
} = tagStore
const transData = $computed(() => problemSum.map(item => ({
  key: `${item.pid}`,
  label: `${item.pid} | ${item.title}`,
})))

fetchTag()

async function fetchTag () {
  Spin.show()
  await Promise.all([ problemStore.find({ page: -1 }), tagStore.find() ])
  problemList = problemSum.map(item => item.pid)
  Spin.hide()
}

function handleChange (newTargetKeys) {
  targetKeys = newTargetKeys
}

async function manageTag (name) {
  if (tagList.length > 0) {
    tag.tid = tagList[ind].tid
  }
  operation = name
  if (name === 'search') {
    Spin.show()
    targetKeys = []
    isNew = false
    try {
      await findOne({ tid: tag.tid })
      targetKeys = tag.list.map(item => `${item}`)
    } finally {
      Spin.hide()
    }
  } else if (name === 'create') {
    tag.tid = ''
    tag.list = []
    targetKeys = []
    isNew = true
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
  const newTag = Object.assign(
    only(tag, 'tid'),
    { list: problems },
  )
  Spin.show()
  try {
    if (!isNew) {
      await update(newTag)
      Message.success(t('oj.update_tag_success', tag))
    } else {
      await create(tag)
      find()
      Message.success(t('oj.create_tag_success', tag))
    }
  } finally {
    Spin.hide()
  }
}

onBeforeRouteLeave(() => {
  clearSavedProblems()
  clearSavedTags()
  problemList = []
  targetKeys = []
})
</script>

<template>
  <div>
    <h1>{{ t('oj.manage_tag') }}</h1>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Tag
      </Col>
      <Col :span="4">
        <Select v-model="ind" filterable>
          <Option v-for="(item, index) in tagList" :key="item.tid" :value="index">
            {{ item.tid }}
          </Option>
        </Select>
      </Col>
      <Col :offset="1" :span="2">
        <Dropdown @on-click="manageTag">
          <Button type="primary">
            {{ t('oj.manage_tag') }}
            <Icon type="ios-arrow-down" />
          </Button>
          <template #list>
            <DropdownMenu>
              <DropdownItem name="search">
                {{ t('oj.search') }}
              </DropdownItem>
              <DropdownItem name="create">
                {{ t('oj.create') }}
              </DropdownItem>
              <DropdownItem name="delete">
                {{ t('oj.delete') }}
              </DropdownItem>
            </DropdownMenu>
          </template>
        </Dropdown>
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Title
      </Col>
      <Col :span="4">
        <Input v-model="tag.tid" />
      </Col>
    </Row>
    <Transfer
      :data="transData"
      :target-keys="targetKeys"
      :list-style="listStyle"
      filterable
      class="tranfer"
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
