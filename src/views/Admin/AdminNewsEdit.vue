<template lang="html">
  <div>
    <label class="label">Title</label>
    <input type="text" class="input" v-model="title">
    <label class="label">Content</label>
    <oj-quill
      :initContent="news.content"
      @change="contentChange"
    >
    </oj-quill>
    <br>
    <br>
    <br>
    <hr>
    <button class="button is-primary" @click="updateNews">Submit</button>
  </div>
</template>

<script>

import Quill from '../../components/Quill.vue'

export default {
  components: {
    'oj-quill': Quill
  },
  props: ['nid'],
  data () {
    return {
      title: '',
      content: ''
    }
  },
  created () {
    this.$store.dispatch('fetchNews', {
      nid: this.nid
    }).then(() => {
      this.title = this.news.title
      this.content = this.news.content
    })
  },
  computed: {
    news () {
      return this.$store.getters.news
    }
  },
  methods: {
    contentChange (text) {
      this.content = text
    },
    updateNews () {
      this.$store.dispatch('updateNews', {
        nid: this.nid,
        title: this.title,
        content: this.content
      }).then(() => {
        this.$store.dispatch('addMessage', {
          body: `News ${this.news.title} has been updated!`
        })
        this.$router.push({
          name: 'news',
          params: {
            nid: this.nid
          }
        })
      })
    }
  }
}
</script>

<style lang="css">
</style>
