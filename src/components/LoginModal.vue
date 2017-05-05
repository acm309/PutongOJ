<template lang="html">
  <div class="modal" :class="{'is-active': loginModalActive}">
    <div class="modal-background" @click="closeModal"></div>
    <div class="modal-content box">
      <div class="field">
        <label class="label">Username</label>
        <p class="control">
          <input class="input" type="text" placeholder="Username">
        </p>
      </div>
      <div class="field">
        <label class="label">Password</label>
        <p class="control">
          <input class="input" type="password" placeholder="Password">
        </p>
      </div>
      <button class="button is-primary"> Login </button>
      <button @click="closeModal" class="button">Cancel</button>
    </div>
    <button class="modal-close" @click="closeModal"></button>
  </div>
</template>

<script>
export default {
  computed: {
    loginModalActive () {
      return this.$store.getters.loginModalActive
    }
  },
  methods: {
    closeModal () {
      this.$store.commit('closeLoginModal')
    }
  }
}
</script>

<style lang="css">
</style>
