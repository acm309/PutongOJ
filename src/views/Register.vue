<template lang="html">
  <div>
    <div class="field">
      <label class="label">Username</label>
      <p class="control has-icons-left has-icons-right">
        <input class="input" type="text"
          placeholder="Only numbers and letters; The length should be between 5 and 20; This can't be changed later"
          v-model="uid">
        <span class="icon is-small is-left">
          <i class="fa fa-user"></i>
        </span>
      </p>
      <label class="label">Nick</label>
      <p class="control has-icons-left has-icons-right">
        <input class="input" type="text" placeholder="Be ease; This can be changed later" v-model="nick">
        <span class="icon is-small is-left">
          <i class="fa fa-smile-o" aria-hidden="true"></i>
        </span>
      </p>
      <label class="label">Password</label>
      <p class="control has-icons-left has-icons-right">
        <input class="input" type="password" v-model="pwd">
        <span class="icon is-small is-left">
          <i class="fa fa-unlock-alt" aria-hidden="true"></i>
        </span>
      </p>
      <label class="label">Confirm Password</label>
      <p class="control has-icons-left has-icons-right">
        <input class="input" type="password" v-model="cm_pwd">
        <span class="icon is-small is-left">
          <i class="fa fa-unlock-alt" aria-hidden="true"></i>
        </span>
      </p>
    </div>
    <button class="button is-primary" @click="register">Submit</button>
    <button class="button">Reset</button>
  </div>
</template>

<script>
// TODO 字段检查
export default {
  data () {
    return {
      uid: '',
      nick: '',
      pwd: '',
      cm_pwd: ''
    }
  },
  methods: {
    register () {
      this.$store.dispatch('register', {
        uid: this.uid,
        nick: this.nick,
        pwd: this.pwd
      })
    }
  }
}
</script>

<style lang="css">
</style>
