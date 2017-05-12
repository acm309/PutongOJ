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
      <p class="help is-danger" v-if="error">{{ error }}</p>
    </div>
    <button
      class="button is-primary"
      @click="register"
      :class="{'is-loading': loading}"
    >Submit</button>
    <button class="button">Reset</button>
  </div>
</template>

<script>
// TODO 字段检查
export default {
  data () {
    return {
      loading: false,
      uid: '',
      nick: '',
      pwd: '',
      cm_pwd: '',
      error: ''
    }
  },
  methods: {
    register () {
      // 做一些简单的校验
      if (!this.uid || !this.nick || !this.cm_pwd || !this.pwd) {
        this.error = 'Please complete all the fields'
        return
      } else if (/[^\w\d]/ig.test(this.uid)) {
        this.error = 'Username should only consist of letters or numbers'
        return
      } else if (this.pwd !== this.cm_pwd) {
        this.error = 'Two passwords are not same'
        return
      }
      this.loading = true
      this.$store.dispatch('register', {
        uid: this.uid,
        nick: this.nick,
        pwd: this.pwd
      }).then(() => {
        this.$store.dispatch('addMessage', {
          body: `Welcome, ${this.uid}`
        })
        this.$router.push({
          name: 'user',
          params: {
            uid: this.uid
          }
        })
        this.loading = false
      }).catch((err) => {
        this.error = err.message
        this.loading = false
      })
    }
  },
  watch: {
    uid (to, from) {
      this.error = ''
    },
    nick (to, from) {
      this.error = ''
    },
    pwd (to, from) {
      this.error = ''
    },
    cm_pwd (to, from) {
      this.error = ''
    }

  }
}
</script>

<style lang="css">
</style>
