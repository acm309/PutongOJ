<script setup>
import { storeToRefs } from 'pinia'
import only from 'only'
import { inject } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store/modules/user'
import { useGroupStore } from '@/store/modules/group'

const { t } = useI18n()
const userStore = useUserStore()
const groupStore = useGroupStore()
const { group, list: groupList } = $(storeToRefs(groupStore))
const { list: userSum } = $(storeToRefs(userStore))
const { find, findOne, update, create, clearSavedGroups } = groupStore
const { clearSavedUsers } = userStore
const Spin = inject('$Spin')
const Message = inject('$Message')
const Modal = inject('$Modal')

const ind = $ref('')
let targetKeys = $ref([])
const listStyle = $ref({
  width: '350px',
  height: '400px',
})

let userList = $ref([])
let operation = $ref('search')

const transData = $computed(() => userSum.map(item => ({
  key: item.uid,
  label: `${item.uid} | ${item.nick}`,
})))

// per vue-router: onBeforeRouteLeave must be called at the top
// of function
onBeforeRouteLeave(() => {
  clearSavedGroups()
  clearSavedUsers()
})

async function fetchGroup () {
  Spin.show()
  await Promise.all([ userStore.find(), find() ])
  userList = userSum.map(item => item.uid)
  Spin.hide()
}

function handleChange (newTargetKeys) {
  targetKeys = newTargetKeys
}

async function manageGroup (name) {
  if (groupList.length > 0) {
    group.gid = groupList[ind].gid
    group.title = groupList[ind].title
  }
  operation = name
  if (name === 'search') {
    Spin.show()
    targetKeys = []
    try {
      await findOne({ gid: group.gid })
      targetKeys = group.list.slice()
    } finally {
      Spin.hide()
    }
  } else if (name === 'create') {
    group.gid = ''
    group.title = ''
    group.list = []
    targetKeys = []
  } else if (name === 'delete') {
    if (!group || !group.gid) {
      Message.info(t('oj.no_group'))
    } else {
      Modal.confirm({
        title: t('oj.warning'),
        content: `<p>${t('oj.will_remove_group', group)}</p>`,
        okText: t('oj.ok'),
        cancelText: t('oj.cancel'),
        onOk: async () => {
          await remove({ gid: group.gid })
          Message.success(t('oj.remove_group_success', group))
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
  } finally {
    Spin.hide()
  }
}

fetchGroup()
</script>

<template>
  <div>
    <h1>{{ t('oj.manage_group') }}</h1>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Group
      </Col>
      <Col :span="4">
        <Select v-model="ind" filterable>
          <Option v-for="(item, index) in groupList" :key="item.gid" :value="index">
            {{ item.title }}
          </Option>
        </Select>
      </Col>
      <Col :offset="1" :span="2">
        <Dropdown @on-click="manageGroup">
          <Button type="primary">
            {{ t('oj.manage_group') }}
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
        <Input v-model="group.title" />
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
</style>
