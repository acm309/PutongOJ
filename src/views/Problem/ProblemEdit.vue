<template lang="html">
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
    <div class="label">Description</div>
    <Row>
      <Col :span="23">
        <vue-editor id="editor1"
          useCustomImageHandler
          @imageAdded="handleImageAdded" v-model="problem.description">
        </vue-editor>
        <!-- <quill-editor ref="myTextEditor" v-model="problem.description" :config="editorOption"></quill-editor> -->
      </Col>
    </Row>
    <div class="label">Input</div>
    <Row>
      <Col :span="23">
        <vue-editor id="editor2" v-model="problem.input"></vue-editor>
        <!-- <quill-editor ref="myTextEditor" v-model="problem.input" :config="editorOption"></quill-editor> -->
      </Col>
    </Row>
    <div class="label">Output</div>
    <Row>
      <Col :span="23">
        <vue-editor id="editor3" v-model="problem.output"></vue-editor>
        <!-- <quill-editor ref="myTextEditor" v-model="problem.output" :config="editorOption"></quill-editor> -->
      </Col>
    </Row>
    <div class="label">Hint</div>
    <Row>
      <Col :span="23">
        <vue-editor id="editor4" v-model="problem.hint"></vue-editor>
        <!-- <quill-editor ref="myTextEditor" v-model="problem.hint" :config="editorOption"></quill-editor> -->
      </Col>
    </Row>
    <div class="label">Sample Input</div>
    <Row>
      <Col :span="23">
        <Input type="textarea" :rows="8" v-model="problem.in"></Input>
      </Col>
    </Row>
    <div class="label">Sample Output</div>
    <Row>
      <Col :span="23">
        <Input type="textarea" :rows="8" v-model="problem.out"></Input>
      </Col>
    </Row>
    <Button type="primary" @click="submit">Submit</Button>
  </div>
</template>

<script>
import api from '@/api.js'
import axios from 'axios'
import { mapGetters } from 'vuex'
import { VueEditor } from 'vue2-editor'

export default {
  data () {
    return {
    }
  },
  computed: {
    ...mapGetters('problem', [
      'problem'
    ])
  },
  created () {
    this.$store.dispatch('problem/findOne', { pid: this.$route.params.pid })
  },
  methods: {
    handleImageAdded (file, Editor, cursorLocation) {
      const formData = new window.FormData()
      formData.append('image', file)
      axios.post('/submit', formData) // TODO
        .then(({ data }) => {
          const url = data.url // Get url from response
          Editor.insertEmbed(cursorLocation, 'image', url)
        })
        .catch((err) => console.log(err))
    },
    submit () {
      api.problem.update(this.problem).then(({ data }) => {
        if (data.success) {
          this.$Message.success('提交成功！')
          this.$router.push({name: 'problemInfo', params: { pid: data.pid }})
        }
      })
    }
  },
  components: {
    VueEditor
  }
}
</script>

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
