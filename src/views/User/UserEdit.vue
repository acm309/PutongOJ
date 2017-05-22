<template lang="html">
  <div>
    <div v-if="self && self.uid === user.uid">
      <div class="field">
        <label class="label">Username</label>
        <p class="control">
          <input class="input" type="text" v-model="uid" disabled="">
        </p>
      </div>
      <div class="field">
        <label class="label">Nick</label>
        <p class="control">
          <input class="input" type="text" v-model="nick">
        </p>
      </div>
      <div class="field">
        <label class="label">Motto</label>
        <p class="control">
          <input class="input" type="text" v-model="motto">
        </p>
      </div>
      <div class="field">
        <label class="label">School</label>
        <p class="control">
          <input class="input" type="text" v-model="school">
        </p>
      </div>
      <div class="field">
        <label class="label">Mail</label>
        <p class="control">
          <input class="input" type="text" v-model="mail">
        </p>
      </div>
      <div class="field">
        <label class="label">Password</label>
        <p class="control">
          <input class="input" type="password" placeholder="Leave it blank if it is not changed"
            v-model="pwd"
          >
        </p>
      </div>
      <div class="field">
        <label class="label">Confirm Password</label>
        <p class="control">
          <input class="input" type="password" placeholder="Leave it blank if it is not changed"
            v-model="cm_pwd"
          >
        </p>
      </div>
      <button class="button is-primary" @click="submit">Submit</button>
    </div>
    <div v-else>
      You are not allowed to change other's profile
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data () {
    return {
      uid: '',
      nick: '',
      school: '',
      motto: '',
      mail: '',
      pwd: '',
      cm_pwd: ''
    }
  },
  props: ['user'],
  created () {
    ;[this.uid, this.nick, this.school, this.motto, this.mail] = [
      this.user.uid, this.user.nick, this.user.school, this.user.motto, this.user.mail
    ]
  },
  methods: {
    submit () {
      const payload = {
        uid: this.uid,
        nick: this.nick,
        // 如果不加 undefined，下列属性会当作空字符串传过去
        school: this.school,
        motto: this.motto,
        mail: this.mail
      }
      this.$emit('updateUser', this.pwd === '' ? payload : {
        ...payload,
        pwd: this.pwd
      })
    }
  },
  computed: {
    ...mapGetters([ 'self' ])
  },
  watch: {
    'user' (to, from) {
      ;[this.uid, this.nick, this.school, this.motto, this.mail] = [
        to.user.uid, to.user.nick, to.user.school, to.user.motto, to.user.mail
      ]
    }
  }
}
</script>

<style lang="css">
</style>
