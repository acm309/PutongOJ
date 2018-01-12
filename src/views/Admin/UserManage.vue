<template lang="html">
  <div>
    <h1>重置密码</h1>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">Title</Col>
      <Col :span="21">
        <Input v-model="user.uid"></Input>
      </Col>
    </Row>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">Title</Col>
      <Col :span="21">
        <Input v-model="user.pwd"></Input>
      </Col>
    </Row>
    <Button type="primary" @click="submit">Submit</Button>
  </div>
</template>

<script>
export default {
  data: () => ({
    user: {
      uid: '',
      pwd: ''
    }
  }),
  methods: {
    submit () {
      this.$store.dispatch('user/update', this.user).then(() => {
        this.$Message.success('修改成功！')
      })
    }
  }
}
</script>

<style lang="css">
</style>
