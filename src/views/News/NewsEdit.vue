<template>
  <div>
    <h1>修改消息</h1>
    <oj-news-edit></oj-news-edit>
    <Button type="primary" size="large" @click="submit">Submit</Button>
  </div>
</template>
<script>
import NewsEdit from '@/components/NewsEdit'
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters('news', [
      'news'
    ])
  },
  methods: {
    submit () {
      if (!this.news.title) {
        this.$Message.error('Title can not be empty')
      } else {
        this.$store.dispatch('news/update', this.news)
          .then((nid) => {
            this.$Message.success(`News "${this.news.title}" has been updated!`)
            this.$router.push({ name: 'newsInfo', params: { nid } })
          })
      }
    }
  },
  components: {
    'oj-news-edit': NewsEdit
  }
}
</script>
<style lang="stylus" scoped>
h1
  margin-bottom: 20px
.ivu-btn
  margin-top: 20px
</style>
