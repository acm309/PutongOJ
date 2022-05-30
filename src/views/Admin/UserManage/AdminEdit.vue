<script>
import { mapState } from 'pinia'
import only from 'only'
import { useUserStore } from '@/store/modules/user'
import { useRootStore } from '@/store'

export default {
  data: () => ({
    admin: '',
  }),
  computed: {
    ...mapState(useUserStore, [ 'adminList' ]),
    ...mapState(useRootStore, [ 'privilege' ]),
  },
  created () {
    this.fetchAdmin()
  },
  methods: {
    getOptions () {
      return [ {
        value: this.privilege.Teacher,
        label: 'Teacher',
      },
      {
        value: this.privilege.Root,
        label: 'Admin',
      } ]
    },
    update (user) {
      const payload = only(user, 'uid privilege')
      useUserStore().update(payload).then(() => {
        this.$Message.success(`成功更新 ${payload.uid} 用户！`)
        this.fetchAdmin()
        this.admin = ''
      })
    },
    fetchAdmin () {
      useUserStore().find({ privilege: 'admin' })
    },
    add () {
      const user = {
        uid: this.admin,
        privilege: this.privilege.Teacher,
      }
      useUserStore().update(user).then(() => {
        this.$Message.success(`成功设置 ${this.admin} 用户为管理员！`)
        this.fetchAdmin()
        this.admin = ''
      })
    },
    remove (item) {
      const user = Object.assign(
        only(item, 'uid nick'),
        { privilege: this.privilege.PrimaryUser },
      )
      this.$Modal.confirm({
        title: '提示',
        content: `<p>此操作将删除${user.uid}用户的管理员权限, 是否继续?</p>`,
        onOk: () => {
          useUserStore().update(user).then(() => {
            this.$Message.success(`成功设置${user.uid}用户为普通用户！`)
            this.fetchAdmin()
          })
        },
        onCancel: () => {
          this.$Message.info('已取消删除！')
        },
      })
    },
  },
}
</script>

<template>
  <div>
    <h1>增删管理员</h1>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Username
      </Col>
      <Col :span="4">
        <Input v-model="admin" @keyup.enter.native="add" />
      </Col>
      <Col :offset="1" :span="2">
        <Button type="primary" @click="add">
          Add
        </Button>
      </Col>
    </Row>
    <table>
      <tr>
        <th>Username</th>
        <th>Nick</th>
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
      <p>Admin 为最高权限，具有所有权限。</p>
      <p>Teacher 具有除删除外的所有权限。</p>
      <p>一般，被添加的用户通过刷新网页或重新登录即可查看新权限。</p>
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
