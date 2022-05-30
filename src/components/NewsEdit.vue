<script>
import { VueEditor } from 'vue2-editor'
import { mapState } from 'pinia'
import api from '@/api'
import { useNewsStore } from '@/store/modules/news'

export default {
  computed: {
    ...mapState(useNewsStore, [ 'news' ]),
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
        .catch(err => console.log(err))
    },
  },
  components: {
    VueEditor,
  },
}
</script>

<template>
  <div>
    <Row type="flex" justify="start">
      <Col :span="2" class="label">
        Title
      </Col>
      <Col :span="21">
        <Input v-model="news.title" />
      </Col>
    </Row>
    <Row>
      <Col :span="23">
        <VueEditor
          id="editor1"
          v-model="news.content"
          use-custom-image-handler @imageAdded="handleImageAdded"
        />
      </Col>
    </Row>
  </div>
</template>

<style lang="stylus" scoped>
.ivu-row-flex
  margin-bottom: 20px
.label
  font-size: 16px
  line-height: 32px
</style>
