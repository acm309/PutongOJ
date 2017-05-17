<template lang="html">
  <div>
    <div class="field">
      <label class="label">Username</label>
      <p class="control">
        <input class="input" type="text" placeholder="Username" v-model="uid">
      </p>
    </div>
    <div class="field">
      <label class="label">Password</label>
      <p class="control">
        <input class="input" type="text" placeholder="Password" v-model="pwd">
      </p>
    </div>
    <button
      class="button is-primary"
      :class="{'is-loading': loading}"
      :disabled="!uid || !pwd"
      @click="update"
    >Submit</button>
  </div>
</template>

<script>
export default {
  data () {
    return {
      uid: '',
      pwd: '',
      loading: false
    }
  },
  methods: {
    update () {
      this.loading = true
      this.$store.dispatch('updateUser', {
        uid: this.uid,
        pwd: this.pwd
      }).then(() => {
        this.loading = false
        this.$store.dispatch('addMessage', {
          body: 'Update successfully'
        })
      }).catch((err) => {
        this.loading = false
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
