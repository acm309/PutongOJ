<script>
import { mapActions, mapState } from 'pinia'
import NewsEdit from '@/components/NewsEdit'
import { useNewsStore } from '@/store/modules/news'

export default {
  data: () => ({
    addNews: {
      title: '',
      content: '',
    },
  }),
  computed: {
    ...mapState(useNewsStore, [ 'news' ]),
  },
  created () {
    useNewsStore().setCurrentNews(this.addNews)
  },
  methods: {
    ...mapActions(useNewsStore, [ 'create' ]),
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
    },
  },
  components: {
    OjNewsEdit: NewsEdit,
  },
}
</script>

<template>
  <div>
    <h1>新增消息</h1>
    <OjNewsEdit />
    <Button type="primary" size="large" @click="submit">
      Submit
    </Button>
  </div>
</template>

<style lang="stylus" scoped>
h1
  margin-bottom: 20px
.ivu-btn
  margin-top: 20px
</style>
