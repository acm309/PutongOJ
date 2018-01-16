<template lang="html">
  <div>
    <h1>Test Data</h1>
    <table>
      <tr>
        <th>#</th>
        <th>Test in</th>
        <th>Test out</th>
        <th>Delete</th>
      </tr>
      <tr v-for="item in list.testcases">
        <td>1</td>
        <td><a href="#" target="_blank" @click="search(item)">test.in {{ item.uuid }}</a></td>
        <td><a href="#" target="_blank">test.out {{ item.uuid }}</a></td>
        <td>
          <Button type="text" @click="del(item)">Delete</Button>
        </td>
      </tr>
    </table>
    <h1>Create New</h1>
    <p>In</p>
    <Input v-model="test.in" type="textarea" :autosize="{minRows: 5,maxRows: 25}"></Input>
    <p>Out</p>
    <Input v-model="test.out" type="textarea" :autosize="{minRows: 5,maxRows: 25}"></Input>
    <br>
    <br>
    <Button type="primary" @click="create"> Submit </Button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data: () => ({
    test: {
      pid: '',
      in: '',
      out: ''
    }
  }),
  computed: {
    ...mapGetters('testcase', ['list', 'testcase'])
  },
  created () {
    this.fetch()
    this.test.pid = this.$route.params.pid
  },
  methods: {
    fetch () {
      this.$store.dispatch('testcase/find', this.$route.params)
    },
    search (item) {
      const testcase = {
        pid: this.$route.params.pid,
        uuid: item.uuid,
        type: 'in'
      }
      this.$store.dispatch('testcase/findOne', testcase)
    },
    del (item) {
      this.$Modal.confirm({
        title: '提示',
        content: '<p>此操作将永久删除该文件, 是否继续?</p>',
        onOk: () => {
          const testcase = {
            pid: this.$route.params.pid,
            uuid: item.uuid
          }
          this.$store.dispatch('testcase/delete', testcase).then(() => {
            this.$Message.success(`成功删除${item.uuid}！`)
          })
        },
        onCancel: () => {
          this.$Message.info('已取消删除！')
        }
      })
    },
    create () {
      this.$store.dispatch('testcase/create', this.test).then(() => {
        this.$Message.success(`成功创建！`)
        this.fetch()
        this.test.in = ''
        this.test.out = ''
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
table
  width: 100%
  border-collapse: collapse
  border-spacing: 0
  th:nth-child(1)
    padding-left: 10px
  tr
    border-bottom: 1px solid #ebeef5
    height: 40px
    line-height: 40px
    font-size: 14px
    td:nth-child(1)
      padding-left: 10px
  th
    text-align:left
  .ivu-btn
    vertical-align: baseline
    color: #e040fb
    padding: 0 1px
    font-size: 14px
</style>
