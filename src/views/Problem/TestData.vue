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
      <tr>
        <td>1</td>
        <td><a href="#" target="_blank">test.in</a></td>
        <td><a href="#" target="_blank">test.out</a></td>
        <td>
          <Button type="text" @click="del()">Delete</Button>
        </td>
      </tr>
      <tr>
        <td>2</td>
        <td><a href="#" target="_blank">test.in</a></td>
        <td><a href="#" target="_blank">test.out</a></td>
        <td>
          <Button type="text" @click="del()">Delete</Button>
        </td>
      </tr>
      <tr>
        <td>3</td>
        <td><a href="#" target="_blank">test.in</a></td>
        <td><a href="#" target="_blank">test.out</a></td>
        <td>
          <Button type="text" @click="del()">Delete</Button>
        </td>
      </tr>
    </table>
    <h1>Create New</h1>
    <p>In</p>
    <Input v-model="newTest.in" type="textarea" :autosize="{minRows: 5,maxRows: 25}"></Input>
    <p>Out</p>
    <Input v-model="newTest.out" type="textarea" :autosize="{minRows: 5,maxRows: 25}"></Input>
    <br>
    <br>
    <Button type="primary"> Submit </Button>
  </div>
</template>

<script>
export default {
  data: () => ({
    newTest: {
      in: '',
      out: ''
    }
  }),
  methods: {
    del () {
      this.$Modal.confirm({
        title: '提示',
        content: '<p>此操作将永久删除该文件, 是否继续?</p>',
        onOk: () => {
          this.$Message.success(`成功删除！`)
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
