<template lang="html">
  <div class="conadd-wrap" v-if="contest">
    <!-- <pre>{{ jobs }} </pre> -->
    <!-- 这个注释故意留着，有时候偶用于调试蛮方便的 -->
    <oj-contest-edit :contest="contest" :overview="overview"></oj-contest-edit>
    <Button type="primary" @click="submit">Submit</Button>
  </div>
</template>

<script>
import ContestEdit from '@/components/ContestEdit'
import only from 'only'
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters('contest', ['contest', 'overview'])
  },
  methods: {
    submit () {
      this.$store.dispatch('contest/update', this.contest).then(({ data }) => {
        this.$Message.success('提交成功！')
        this.$router.push({name: 'contestOverview', params: only(data, 'cid')})
      })
    }
  },
  components: {
    'oj-contest-edit': ContestEdit
  },
  beforeDestroy () {
    this.$store.dispatch('contest/findOne', only(this.$route.params, 'cid'))
  }
}
</script>

<style lang="stylus" scoped>
</style>

<docs>
  这里，所有的更改都到了 store 里的 contest 上，这个方法并不一定最佳实践。
  一个可能的影响是:
    如果用户，在表单上修改了比赛的开始时间，比如从 1 月 1 日跳到 2 月 1 日，但是他没点 Submit，也就是说这个数据没有写到数据库，但是如果此时 前端的 contest 已经变了，你可以看到上方的进度条已经变了。如果，此时，用户（没有点 Submit）就点了去看排行榜之类的，那么他看到的都是基于开始时间是 2 月 1 日的。
  因此，这个时候用户看到的是有问题的！
  为了，解决这个问题，我在这里，beforeDestroy 处，再次请求了一次比赛。这样，不管用户最终有没有提交修改后的比赛表单，都能保持前端数据与数据库的保持同步。
</docs>
