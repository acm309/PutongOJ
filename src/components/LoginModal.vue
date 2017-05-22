<template lang="html">
  <transition
  enter-active-class="animated fadeInUp"
  leave-active-class="animated fadeOutDown"
  >

    <div class="modal is-active" v-if="loginModalActive">
      <div class="modal-background" @click="closeModal"></div>
      <div class="modal-content box">
        <div class="field">
          <label class="label">Username</label>
          <p class="control">
            <input class="input" type="text" placeholder="Username" v-model="uid">
          </p>
        </div>
        <div class="field">
          <label class="label">Password</label>
          <p class="control">
            <input
              class="input"
              type="password"
              placeholder="Password"
              v-model="pwd"
              @keyup.enter="login"
            >
          </p>
          <p class="help is-danger" v-if="error">{{ error }}</p>
        </div>
        <button
          class="button is-primary"
          @click="login"
          :class="{'is-loading': loading}"
        > Login </button>
        <button @click="closeModal" class="button">Cancel</button>
      </div>
      <button class="modal-close" @click="closeModal"></button>
    </div>
  </transition>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  data () {
    return {
      uid: '',
      pwd: '',
      error: '',
      loading: false
    }
  },
  computed: {
    ...mapGetters([ 'loginModalActive' ])
  },
  methods: {
    ...mapMutations({
      closeModal: 'closeLoginModal'
    }),
    login () {
      if (!this.uid || !this.pwd) {
        this.error = 'Username and Password should not be empty'
        return
      } else if (/[^\w\d]/ig.test(this.uid)) {
        this.error = 'Username should only consist of letters or numbers'
        return
      }
      this.loading = true
      this.$store.dispatch('login', {
        uid: this.uid,
        pwd: this.pwd
      }).then(() => {
        this.loading = false
        this.$store.dispatch('addMessage', {
          body: `Welcome! ${this.uid}`
        })

        // 登录完成后记得清空，否则再次点击会显示上次登录时的用户名和密码
        this.uid = this.pwd = ''
        this.$store.commit('closeLoginModal')
      }).catch((err) => {
        this.loading = false
        this.error = err.message
      })
    }
  },
  watch: {
    'uid' (to, from) {
      this.error = ''
    },
    'pwd' (to, from) {
      this.error = ''
    }
  }
}
</script>

<style lang="css">
</style>
