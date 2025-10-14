<script setup>
import only from 'only'
import { storeToRefs } from 'pinia'
import { inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave } from 'vue-router'
import { getAllUserItems } from '@/api/user'
import { useGroupStore } from '@/store/modules/group'

const { t } = useI18n()
const groupStore = useGroupStore()
const { group, list: groupList } = $(storeToRefs(groupStore))
const { find, findOne, update, create, clearSavedGroups, delete: remove } = groupStore
const newGid = $ref('')
const Spin = inject('$Spin')
const Message = inject('$Message')
const Modal = inject('$Modal')

const targetGid = $ref(0)
let targetKeys = $ref([])
const listStyle = $ref({
  width: '350px',
  height: '400px',
})

const userSum = ref([])

const transData = $computed(() => userSum.value.map(item => ({
  key: item.uid,
  label: `${item.uid} | ${item.nick}`,
})))

// per vue-router: onBeforeRouteLeave must be called at the top
// of function
onBeforeRouteLeave(() => {
  clearSavedGroups()
})

async function findUsers () {
  const resp = await getAllUserItems()
  if (!resp.success) {
    userSum.value = []
    return
  }
  userSum.value = resp.data
}

async function fetchGroup () {
  Spin.show()
  await Promise.all([ findUsers(), find() ])
  Spin.hide()
}

function handleChange (newTargetKeys) {
  targetKeys = newTargetKeys
}

async function manageGroup (name) {
  if (name === 'search') {
    Spin.show()
    targetKeys = []
    try {
      await findOne({ gid: groupList[targetGid].gid })
      targetKeys = group.list.slice()
    } finally {
      Spin.hide()
    }
  } else if (name === 'delete') {
    if (!group || !group.gid) {
      Message.info(t('oj.no_group'))
    } else {
      Modal.confirm({
        title: t('oj.warning'),
        content: t('oj.will_remove_group', group),
        okText: t('oj.ok'),
        cancelText: t('oj.cancel'),
        onOk: async () => {
          await remove({ gid: group.gid })
          Message.success(t('oj.remove_group_success', group))
          await find()
        },
        onCancel: () => {
          Message.info(t('oj.cancel_remove'))
        },
      })
    }
  }
}

async function saveGroup () {
  const user = targetKeys
  const newGroup = Object.assign(
    only(group, 'gid title'),
    { list: user },
  )
  Spin.show()
  try {
    if (group.gid !== '') {
      await update(newGroup)
      Message.success(t('oj.update_group_success', group))
    } else {
      await create(newGroup)
      Message.success(t('oj.create_group_success', group))
    }
    await find()
  } finally {
    Spin.hide()
  }
}

async function createTag () {
  const user = targetKeys
  Spin.show()
  try {
    await create({ list: user, title: newGid })
    await find()
    Message.success(t('oj.create_group_success', { title: newGid }))
  } finally {
    Spin.hide()
  }
}

fetchGroup()
</script>

<template>
  <div class="usermanage">
    <h1>{{ t('oj.manage_group') }}</h1>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Title
      </Col>
      <Col :span="4">
        <Input v-model="newGid" />
      </Col>
      <Col offset="1" :span="6">
        <Button type="primary" :disabled="!newGid" @click="createTag">
          {{ t('oj.create') }}
        </Button>
        <!-- TODO: implement rename -->
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Group
      </Col>
      <Col :span="4">
        <Select v-model="targetGid" filterable @on-select="manageGroup('search')">
          <Option v-for="(item, index) in groupList" :key="item.gid" :value="index">
            {{ item.title }}
          </Option>
        </Select>
      </Col>
      <Col :offset="1" :span="2">
        <Button type="primary" @click="manageGroup('delete')">
          {{ t('oj.delete') }}
        </Button>
        <!-- <template #list>
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
          </template> -->
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
    <Button type="primary" class="submit" @click="saveGroup">
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
