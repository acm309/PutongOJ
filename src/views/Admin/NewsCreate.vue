<template lang="html">
  <div>
    <h1>新增消息</h1>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">Title</Col>
      <Col :span="21">
        <Input v-model="news.title"></Input>
      </Col>
    </Row>
    <Row>
      <Col :span="23">
        <vue-editor id="editor1"
          useCustomImageHandler
          @imageAdded="handleImageAdded" v-model="news.content">
        </vue-editor>
      </Col>
    </Row>
    <Button type="primary" size="large" @click="submit">Submit</Button>
  </div>
</template>

<script>
import axios from 'axios'
import { mapActions } from 'vuex'
import { VueEditor } from 'vue2-editor'

export default {
  data: () => ({
    news: {
      title: '',
      content: ''
    }
  }),
  methods: {
    ...mapActions('news', [ 'create' ]),
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
      if (!this.news.title) {
        this.$Message.error('Title can not be empty')
      } else {
        this
          .create(this.news)
          .then((nid) => {
            this.$Message.success(`News "${this.news.title}" has been created!`)
            this.$router.push({ name: 'newsInfo', params: { nid } })
          })
      }
    }
  },
  components: {
    VueEditor
  }
}
</script>

<style lang="stylus" scoped>
h1
  margin-bottom: 20px
.ivu-row-flex
  margin-bottom: 20px
.label
  font-size: 16px
  line-height: 32px
.ivu-btn
  margin-top: 20px
</style>
