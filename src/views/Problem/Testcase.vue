<script setup>
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { inject } from 'vue'
import { testcaseUrl } from '@/util/helper'
import { useTestcaseStore } from '@/store/modules/testcase'

// TODO: test this url
const testcaseStore = useTestcaseStore()
const { list } = $(storeToRefs(testcaseStore))

const route = useRoute()
const $Message = inject('$Message')
const $Modal = inject('$Modal')

const test = $ref({
  pid: route.params.pid,
  input: '',
  output: '',
})

const fetch = () => testcaseStore.find(route.params)

const search = item => testcaseStore.findOne({
  pid: route.params.pid,
  uuid: item.uuid,
  type: 'in',
})

function del (item) {
  $Modal.confirm({
    title: '提示',
    content: '<p>此操作将永久删除该文件, 是否继续?</p>',
    onOk: async () => {
      const testcase = {
        pid: this.$route.params.pid,
        uuid: item.uuid,
      }
      await testcaseStore.delete(testcase)
      $Message.success(`成功删除${item.uuid}！`)
    },
    onCancel: () => {
      $Message.info('已取消删除！')
    },
  })
}

async function create () {
  await testcaseStore.create(test)
  $Message.success('成功创建！')
  fetch()
  test.in = test.out = ''
}

fetch()
</script>

<template>
  <div>
    <h1>Test Data</h1>
    <table>
      <tr>
        <th>#</th>
        <th>Test in</th>
        <th>Test out</th>
        <th>Delete</th>
      </tr>
      <tr v-for="item in list.testcases" :key="item.uuid">
        <td>{{ item.uuid.slice(0, 8) }}</td>
        <td><a :href="testcaseUrl(test.pid, item.uuid, 'in')" target="_blank" @click="search(item)">test.in</a></td>
        <td><a :href="testcaseUrl(test.pid, item.uuid, 'out')" target="_blank">test.out</a></td>
        <td>
          <Button type="text" @click="del(item)">
            Delete
          </Button>
        </td>
      </tr>
    </table>
    <h1>Create New</h1>
    <p>In</p>
    <Input v-model="test.in" type="textarea" :autosize="{ minRows: 5, maxRows: 25 }" />
    <p>Out</p>
    <Input v-model="test.out" type="textarea" :autosize="{ minRows: 5, maxRows: 25 }" />
    <br>
    <br>
    <Button type="primary" @click="create">
      Submit
    </Button>
  </div>
</template>
