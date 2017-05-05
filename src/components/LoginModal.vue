<template lang="html">
  <div class="modal" :class="{'is-active': loginModalActive}">
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
      </div>
      <button class="button is-primary" @click="login"> Login </button>
      <button @click="closeModal" class="button">Cancel</button>
    </div>
    <button class="modal-close" @click="closeModal"></button>
  </div>
</template>

<script>
export default {
  data () {
    return {
      uid: '',
      pwd: ''
    }
  },
  computed: {
    loginModalActive () {
      return this.$store.getters.loginModalActive
    }
  },
  methods: {
    closeModal () {
      this.$store.commit('closeLoginModal')
    },
    login () {
      this.$store.dispatch('login', {
        uid: this.uid,
        pwd: this.pwd
      }).then(() => {
        this.$store.commit('closeLoginModal')
      })
    }
  }
}
</script>

<style lang="css">
</style>
