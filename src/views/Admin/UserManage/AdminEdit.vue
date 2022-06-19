<script setup>
import { mapState, storeToRefs } from 'pinia'
import only from 'only'
import { useI18n } from 'vue-i18n'
import { inject } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { useRootStore } from '@/store'

const { t } = useI18n()
const userStore = useUserStore()
const rootStore = useRootStore()
const Message = inject('$Message')
const Modal = inject('$Modal')

const { adminList } = $(storeToRefs(userStore))
const { privilege } = $(storeToRefs(rootStore))

let admin = $ref('')
const fetchAdmin = () => userStore.find({ privilege: 'admin' })

function getOptions () {
  return [ {
    value: privilege.Teacher,
    label: 'Teacher',
  }, {
    value: privilege.Root,
    label: 'Admin',
  } ]
}

async function update (user) {
  const payload = only(user, 'uid privilege')
  await userStore.update(payload)
  Message.success(t('oj.update_success'))
  fetchAdmin()
  admin = ''
}

async function add () {
  const user = {
    uid: admin,
    privilege: privilege.Teacher,
  }
  await useUserStore().update(user)
  Message.success(t('oj.update_success'))
  fetchAdmin()
  admin = ''
}

async function remove (item) {
  const user = Object.assign(
    only(item, 'uid nick'),
    { privilege: privilege.PrimaryUser },
  )
  Modal.confirm({
    title: t('oj.warning'),
    content: t('oj.will_remove_admin', user),
    okText: t('oj.ok'),
    cancelText: t('oj.cancel'),
    onOk: async () => {
      await useUserStore().update(user)
      Message.success(t('oj.update_success'))
      fetchAdmin()
    },
    onCancel: () => {
      Message.info(t('oj.cancel_remove'))
    },
  })
}

fetchAdmin()
</script>

<template>
  <div>
    <h1>{{ t('oj.add_remove_admin') }}</h1>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        {{ t('oj.username') }}
      </Col>
      <Col :span="4">
        <Input v-model="admin" @keyup.enter="add" />
      </Col>
      <Col :offset="1" :span="2">
        <Button type="primary" @click="add">
          {{ t('oj.add') }}
        </Button>
      </Col>
    </Row>
    <table>
      <tr>
        <th>
          {{ t('oj.username') }}
        </th>
        <th>
          {{ t('oj.nick') }}
        </th>
        <th>Remove</th>
        <th>Type</th>
      </tr>
      <template v-for="user in adminList" :key="user.uid">
        <tr>
          <td>{{ user.uid }}</td>
          <td>{{ user.nick }}</td>
          <td>
            <Button v-if="user.uid !== 'admin'" type="text" @click="remove(user)">
              Remove
            </Button>
          </td>
          <td>
            <Select v-if="user.uid !== 'admin'" v-model="user.privilege" @on-change="update(user)">
              <Option v-for="item in getOptions()" :key="item.value" :value="item.value">
                {{ item.label }}
              </Option>
            </Select>
          </td>
        </tr>
      </template>
    </table>
    <Card dis-hover>
      <pre>{{ t('oj.priviledge_explanation') }}</pre>
    </Card>
  </div>
</template>

<style lang="stylus" scoped>
@import '../../../styles/common'

.ivu-col-offset-1
  margin-left: 1%
table
  margin-bottom: 20px
</style>
