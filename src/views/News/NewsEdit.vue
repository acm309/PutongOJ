<script>
import { mapActions, mapState } from 'pinia'
import NewsEdit from '@/components/NewsEdit'
import { useNewsStore } from '@/store/modules/news'

export default {
  computed: {
    ...mapState(useNewsStore, [ 'news' ]),
  },
  methods: {
    ...mapActions(useNewsStore, [ 'update' ]),
    submit () {
      if (!this.news.title) {
        this.$Message.error('Title can not be empty')
      } else {
        this.update(this.news)
          .then((nid) => {
            this.$Message.success(`News "${this.news.title}" has been updated!`)
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
    <h1>修改消息</h1>
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
