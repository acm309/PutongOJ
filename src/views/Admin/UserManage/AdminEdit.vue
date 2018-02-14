<template>
  <div>
    <h1>增删管理员</h1>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">Username</Col>
      <Col :span="4">
        <Input v-model="admin" @keyup.enter.native="add"></Input>
      </Col>
      <Col :offset="1" :span="2">
        <Button type="primary" @click="add">Add</Button>
      </Col>
    </Row>
    <table>
      <tr>
        <th>Username</th>
        <th>Nick</th>
        <th>Remove</th>
      </tr>
      <template v-for="item in adminList">
        <tr>
          <td>{{ item.uid }}</td>
          <td>{{ item.nick }}</td>
          <td>
            <Button v-if="item.uid !== 'admin'" type="text" @click="remove(item)">Remove</Button>
          </td>
        </tr>
      </template>
    </table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import only from 'only'

export default {
  data: () => ({
    admin: ''
  }),
  computed: {
    ...mapGetters({
      adminList: 'user/adminList',
      privilege: 'privilege'
    })
  },
  created () {
    this.fetchAdmin()
  },
  methods: {
    fetchAdmin () {
      this.$store.dispatch('user/find', { privilege: 'admin' })
    },
    add () {
      const user = {
        uid: this.admin,
        privilege: this.privilege.Teacher
      }
      this.$store.dispatch('user/update', user).then(() => {
        this.$Message.success(`成功设置${this.admin}用户为管理员！`)
        this.fetchAdmin()
        this.admin = ''
      })
    },
    remove (item) {
      const user = Object.assign(
        only(item, 'uid nick'),
        { privilege: this.privilege.PrimaryUser }
      )
      this.$Modal.confirm({
        title: '提示',
        content: `<p>此操作将删除${user.uid}用户的管理员权限, 是否继续?</p>`,
        onOk: () => {
          this.$store.dispatch('user/update', user).then(() => {
            this.$Message.success(`成功设置${user.uid}用户为普通用户！`)
            this.fetchAdmin()
          })
        },
        onCancel: () => {
          this.$Message.info('已取消删除！')
        }
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
@import '../../../styles/common'

.ivu-col-offset-1
  margin-left: 1%
table
  margin-bottom: 20px
</style>
