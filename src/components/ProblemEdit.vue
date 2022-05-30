<script>
import { VueEditor } from 'vue2-editor'
import api from '@/api'

export default {
  components: {
    VueEditor,
  },
  props: [ 'problem' ],
  methods: {
    handleImageAdded (file, Editor, cursorLocation) {
      const formData = new window.FormData()
      formData.append('image', file)
      api.getImage(formData)
        .then(({ data }) => {
          const url = data.url // Get url from response
          Editor.insertEmbed(cursorLocation, 'image', url)
        })
        .catch(err => console.log(err))
    },
  },
}
</script>

<template>
  <div class="proadd-wrap">
    <Row>
      <Col :span="23">
        <Input v-model="problem.title">
          <span slot="prepend">Title</span>
        </Input>
      </Col>
    </Row>
    <Row>
      <Col :span="11">
        <Input v-model="problem.time">
          <span slot="prepend">Time</span>
          <span slot="append">MS</span>
        </Input>
      </Col>
      <Col :offset="1" :span="11">
        <Input v-model="problem.memory">
          <span slot="prepend">Memory</span>
          <span slot="append">KB</span>
        </Input>
      </Col>
    </Row>
    <div class="label">
      Description
    </div>
    <Row>
      <Col :span="23">
        <VueEditor
          id="editor1"
          v-model="problem.description"
          use-custom-image-handler @imageAdded="handleImageAdded"
        />
      </Col>
    </Row>
    <div class="label">
      Input
    </div>
    <Row>
      <Col :span="23">
        <VueEditor id="editor2" v-model="problem.input" />
      </Col>
    </Row>
    <div class="label">
      Output
    </div>
    <Row>
      <Col :span="23">
        <VueEditor id="editor3" v-model="problem.output" />
      </Col>
    </Row>
    <div class="label">
      Hint
    </div>
    <Row>
      <Col :span="23">
        <VueEditor id="editor4" v-model="problem.hint" />
      </Col>
    </Row>
    <div class="label">
      Sample Input
    </div>
    <Row>
      <Col :span="23">
        <Input v-model="problem.in" type="textarea" :rows="8" />
      </Col>
    </Row>
    <div class="label">
      Sample Output
    </div>
    <Row>
      <Col :span="23">
        <Input v-model="problem.out" type="textarea" :rows="8" />
      </Col>
    </Row>
  </div>
</template>

<style lang="stylus">
.proadd-wrap
  margin-bottom: 20px
  .ivu-input-wrapper
    margin-bottom: 14px
  .label
    text-align:left
    margin-bottom: 10px
  #editor1, #editor2, #editor3, #editor4
    text-align: left
    height: 220px
    margin-bottom: 10px
  .el-textarea
    margin-bottom: 20px
</style>
