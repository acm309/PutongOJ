<template lang="html">
  <div>
    <Form :model="form" inline>
      <FormItem>
        <Input type="text" v-model="form.pid" placeholder="Pid">
          <Icon type="ios-help-outline" slot="prepend"></Icon>
        </Input>
      </FormItem>
      <FormItem>
        <Input type="text" v-model="form.uid" placeholder="Username">
          <Icon type="ios-person-outline" slot="prepend"></Icon>
        </Input>
      </FormItem>
      <FormItem style="min-width: 120px">
        <Select v-model="form.language" placeholder="Language">
          <Option :value="2">C++ (G++)</Option>
          <Option :value="1">C (GCC)</Option>
          <Option :value="3">Java (openJDK)</Option>
          <Option :value="0">ALL</Option>
        </Select>
      </FormItem>
      <FormItem style="min-width: 120px">
        <Select v-model="form.judge" placeholder="Judge">
          <Option :value="2">Time Limit Exceed</Option>
          <Option :value="1">C (GCC)</Option>
          <Option :value="3">Java (openJDK)</Option>
          <Option :value="0">ALL</Option>
        </Select>
      </FormItem>
      <FormItem>
        <Button type="primary" icon="search">Search</Button>
      </FormItem>
    </Form>
  </div>
</template>

<script>
export default {
  data: () => ({
    form: {
      pid: '',
      uid: '',
      language: '',
      judge: ''
    }
  })
}
</script>

<style>
</style>
