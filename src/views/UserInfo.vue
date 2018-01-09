<template lang="html">
  <div class="user-wrap">
    <Row>
      <Col :span="6">
        <img src="../assets/logo.png" alt="">
        <h1 style="margin-bottom: 20px">{{ user.uid }}</h1>
        <Icon type="person"></Icon>&nbsp;&nbsp;{{ `Nick: ${user.nick}` }}
        <div class="motto">
          <Icon type="edit"></Icon>&nbsp;&nbsp;{{ `Motto: ${user.motto}` }}
        </div>
        <div v-if="user.mail">
          <Icon type="email"></Icon>&nbsp;&nbsp;{{ `Mail: ${user.mail}` }}
        </div>
        <div v-if="user.school">
          <Icon type="university"></Icon>&nbsp;&nbsp;{{ `School: ${user.school}` }}
        </div>
        <Row class="border" type="flex" justify="center">
          <Col :span="12">
            <h1>{{ user.solve }}</h1>
            <h3>Solved</h3>
          </Col>
          <Col :span="12">
            <h1>{{ user.submit }}</h1>
            <h3>Submit</h3>
          </Col>
        </Row>
      </Col>
      <Col :offset="1" :span="17">
        <Tabs value="overview">
          <TabPane label="Overview" name="overview">
            <div class="solved">
              <div class="solved-name">Solved</div>
              <Button v-for="(item, index) in solved" :key="item" type="text">
                <router-link :to="{ name: 'problemInfo', params: { pid: item } }">{{ item }}</router-link>
              </Button>
            </div>
            <div class="unsolved">
              <div class="unsolved-name">Unolved</div>
              <Button v-for="item in unsolved" :key="item" type="text">
                <router-link :to="{ name: 'problemInfo', params: { pid: item } }">{{ item }}</router-link>
              </Button>
            </div>
          </TabPane>
          <TabPane label="Edit" name="edit" class="edit">
            <Row>
              <Col :span="2" class="label">Nick</Col>
              <Col :span="12">
                <Input v-model="user.nick"></Input>
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">Password</Col>
              <Col :span="12">
                <Input v-model="user.pwd"></Input>
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">CheckPwd</Col>
              <Col :span="12">
                <Input v-model="user.checkpwd"></Input>
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">Motto</Col>
              <Col :span="12">
                <Input v-model="user.motto"></Input>
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">School</Col>
              <Col :span="12">
                <Input v-model="user.school"></Input>
              </Col>
            </Row>
            <Row>
              <Col :span="2" class="label">Mail</Col>
              <Col :span="12">
                <Input v-model="user.mail"></Input>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Col>
    </Row>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters('user', {
      user: 'user',
      solved: 'solved',
      unsolved: 'unsolved'
    })
  },
  created () {
    this.$store.dispatch('user/findOne', this.$route.params)
  }
}
</script>

<style lang="stylus">
.user-wrap
  text-align: left
  line-height: 30px
  img
    width: 60%
    margin: 0 20%
  .border
    margin-top: 20px
    padding: 10px 0
    border-top: 1px solid #dfe2e8
    border-bottom: 1px solid #dfe2e8
    h1, h3
      text-align: center
  .solved, .unsolved
    margin-bottom: 30px
  button
    margin-left: 10px
    padding: 0
  a
    color: #B12CCC
  .image
    width: 100%
    display: block
  .motto // motto 可能非常长，以至于一页放不下
    // word-break: break-all
    white-space:nowrap
    text-overflow:ellipsis
    overflow: hidden
  .edit
    .ivu-row
      margin-bottom: 14px
</style>
