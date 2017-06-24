<template lang="html">
  <div class="animated bounceInUp">
    <div class="tabs" v-if="self && self.uid === user.uid">
      <ul>
        <router-link
          tag="li"
          :to="{name: 'user', params: { uid: user.uid }}"
          exact
        >
          <a>Profile</a></router-link>
        <router-link
          tag="li"
          :to="{name: 'useredit', params: { uid: user.uid }}"
        >
          <a>Edit</a></router-link>
      </ul>
    </div>
    <router-view
      :user="user" :solved="solved" :unsolved="unsolved"
      @updateUser="updateUser"
    ></router-view>

  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  props: ['uid'],
  created () {
    this.refresh(this.uid)
  },
  computed: {
    ...mapGetters([
      'user',
      'solved',
      'unsolved',
      'self'
    ])
  },
  methods: {
    updateUser (payload) {
      this.$store.dispatch('updateUser', payload)
        .then(() => {
          this.$store.dispatch('addMessage', {
            body: 'Successfully updated'
          })
          this.$router.push({
            name: 'user',
            params: { uid: this.self.uid }
          })
        })
        .catch((err) => {
          this.$store.dispatch('addMessage', {
            body: err.message,
            type: 'danger'
          })
        })
    },
    refresh (uid) {
      this.$store.dispatch('fetchUser', { uid })
        .then(() => { document.title = uid })
        .catch((err) => {
          this.$store.dispatch('addMessage', {
            body: err.message,
            type: 'danger'
          })
        })
    }
  },
  watch: {
    '$route' (to, from) {
      // 用户 A 如果在看 B 的资料时，突然点击导航栏想看自己的资料。此时，组件重复使用
      // 不会调用 created，所以要 watch
      if (to.params.uid !== from.params.uid) {
        this.refresh(to.params.uid)
      }
    }
  }
}
</script>

<style lang="css">
</style>
