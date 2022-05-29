<template>
  <div>
    <Form v-model="solution">
      <FormItem label="Language" label-position="left">
        <Select v-model="solution.language">
          <Option :value="2">C++ (G++)</Option>
          <Option :value="1">C (GCC)</Option>
          <Option :value="3">Java (openJDK)</Option>
        </Select>
      </FormItem>
      <FormItem>
         <Input v-model="solution.code" type="textarea" :autosize="{minRows:15,maxRows: 20}" placeholder="Paste your code here"></Input>
       </FormItem>
    </Form>
  </div>
</template>
<script>
import { useSolutionStore } from '@/store/modules/solution'
import { mapState } from 'pinia'

export default {
  computed: {
    ...mapState(useSolutionStore, ['solution'])
  },
  created () {
    // 清空solution对象（否则如果先在status里点击他人代码，再进入submit页面，会显示之前看到的代码而不是空）
    useSolutionStore().clearSavedSolution()
  }
}
</script>
<style lang="stylus" scoped>
.ivu-form-item-label
  font-size: 16px
</style>
