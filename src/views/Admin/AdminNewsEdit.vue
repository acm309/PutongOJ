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
    <div class="split-line"></div>
    <button class="button is-primary" @click="updateNews">Submit</button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

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
    ...mapGetters([ 'news' ])
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
      }).catch((err) => {
        this.$store.dispatch('addMessage', {
          body: err.message,
          type: 'danger'
        })
      })
    }
  }
}
</script>

<style lang="css">
</style>
