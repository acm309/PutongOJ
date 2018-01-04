<template lang="html">
  <div>
    <Form :model="form">
      <FormItem label="Language" label-position="left">
        <Select v-model="form.language">
            <Option :value="2">C++ (G++)</Option>
            <Option :value="1">C (GCC)</Option>
            <Option :value="3">Java (openJDK)</Option>
            <Option :value="0">ALL</Option>
        </Select>
      </FormItem>
      <FormItem>
        <Button type="primary">Submit</Button>
        <Button type="ghost" style="margin-left: 8px" @click="reset">Reset</Button>
      </FormItem>
      <FormItem>
           <Input v-model="form.code" type="textarea" :autosize="{minRows:15,maxRows: 20}" placeholder="Paste your code here"></Input>
       </FormItem>
    </Form>
  </div>
</template>

<script>
export default {
  data: () => ({
    form: {
      code: '',
      language: 1
    }
  }),
  methods: {
    reset () {
      this.form.code = ''
    }
  }
}
</script>

<style>
</style>
