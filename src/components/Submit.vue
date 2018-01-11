<template lang="html">
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
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters('solution', [
      'solution'
    ])
  }
}
</script>

<style lang="stylus" scoped>
.ivu-form-item-label
  font-size: 16px
</style>
