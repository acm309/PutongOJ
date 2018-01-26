<template lang="html">
  <div>
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
  </div>
</template>

<script>
import api from '@/api'
import { VueEditor } from 'vue2-editor'
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters('news', [
      'news'
    ])
  },
  methods: {
    handleImageAdded (file, Editor, cursorLocation) {
      const formData = new window.FormData()
      formData.append('image', file)
      api.getImage(formData)
        .then(({ data }) => {
          const url = data.url // Get url from response
          Editor.insertEmbed(cursorLocation, 'image', url)
        })
        .catch((err) => console.log(err))
    }
  },
  components: {
    VueEditor
  }
}
</script>

<style lang="stylus" scoped>
.ivu-row-flex
  margin-bottom: 20px
.label
  font-size: 16px
  line-height: 32px
</style>
