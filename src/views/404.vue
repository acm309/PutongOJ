<script>
export default {
  methods: {
    home () {
      this.$router.push({
        name: 'home',
      })
    },
    back () {
      this.$router.go(-1)
    },
  },
}
</script>

<template>
  <div>
    <Card>
      <Row type="flex" justify="center">
        <Col>
          <p>404 Not Found</p>
        </Col>
      </Row>
      <Row type="flex" justify="center">
        <Col :offset="8" :span="4">
          <Button type="primary" size="large" @click="home">
            Home
          </Button>
        </Col>
        <Col :span="4">
          <Button type="primary" size="large" @click="back">
            Back
          </Button>
        </Col>
        <Col :span="8" />
      </Row>
    </Card>
  </div>
</template>

<style lang="stylus" scoped>
p
  font-size: 80px
  margin-top: 20px
  margin-bottom: 20px
.ivu-row-flex
  margin-bottom: 20px
  .ivu-col
    text-align: center
    .ivu-btn
      width: 140px
</style>
