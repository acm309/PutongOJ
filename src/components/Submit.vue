<script setup>
import { mapState, storeToRefs } from 'pinia'
import { useSolutionStore } from '@/store/modules/solution'

const solutionStore = useSolutionStore()
const { solution } = $(storeToRefs(solutionStore))
// Clear the saved solution in case of the user visits this page after
// they viewed other's solution.
solutionStore.clearSavedSolution()
</script>

<template>
  <div>
    <Form v-model="solution">
      <FormItem label="Language" label-position="left">
        <Select v-model="solution.language">
          <Option :value="2">
            C++ (G++)
          </Option>
          <Option :value="1">
            C (GCC)
          </Option>
          <Option :value="3">
            Java (openJDK)
          </Option>
        </Select>
      </FormItem>
      <FormItem>
        <Input v-model="solution.code" type="textarea" :autosize="{ minRows: 15, maxRows: 20 }" placeholder="Paste your code here" />
      </FormItem>
    </Form>
  </div>
</template>

<style lang="stylus" scoped>
.ivu-form-item-label
  font-size: 16px
</style>
