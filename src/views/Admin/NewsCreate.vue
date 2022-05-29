<template>
  <div>
    <h1>新增消息</h1>
    <oj-news-edit></oj-news-edit>
    <Button type="primary" size="large" @click="submit">Submit</Button>
  </div>
</template>
<script>
import NewsEdit from '@/components/NewsEdit'
import { mapActions, mapState } from 'pinia'
import { useNewsStore } from '@/store/modules/news'

export default {
  data: () => ({
    addNews: {
      title: '',
      content: ''
    }
  }),
  computed: {
    ...mapState(useNewsStore, ['news'])
  },
  created () {
    useNewsStore().setCurrentNews(this.addNews)
  },
  methods: {
    ...mapActions(useNewsStore, ['create']),
    submit () {
      if (!this.news.title) {
        this.$Message.error('Title can not be empty')
      } else {
        this.create(this.news)
          .then((nid) => {
            this.$Message.success(`News "${this.news.title}" has been created!`)
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
