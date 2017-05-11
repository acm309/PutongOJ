<template lang="html">
  <div>
    <label class="label">Title</label>
    <input type="text" placeholder="title" v-model="title" class="input">
    <label class="label">Content</label>
    <oj-quill @change="contentChange"></oj-quill>
    <div class="split-line"></div>
    <hr>
    <button class="button is-primary" @click="createNews">Submit</button>
  </div>
</template>

<script>
import Quill from '../../components/Quill.vue'

export default {
  components: {
    'oj-quill': Quill
  },
  data () {
    return {
      content: '',
      title: ''
    }
  },
  methods: {
    contentChange (text) {
      this.content = text
    },
    createNews () {
      this.$store.dispatch('createNews', {
        title: this.title,
        content: this.content
      }).then(() => {
        this.$router.push({
          name: 'news',
          params: {
            nid: this.news.nid
          }
        })
      })
    }
  },
  computed: {
    news () {
      return this.$store.getters.news
    }
  }
}
</script>

<style lang="css">
</style>
