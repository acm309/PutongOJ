<template lang="html">
  <div class="animated fadeInLeft">
    <table class="table">
      <tbody>
        <tr v-for="discuss in discussesList">
          <td># {{ discuss.did }}</td>
          <td>{{ discuss.title }}</td>
          <td>
            <router-link
              :to="{name: 'user', params: { uid: discuss.uid }}"
            >
              {{ discuss.uid }}
            </router-link>
            </td>
          <td>Updated on {{ discuss.update | timeFromNow }}</td>
        </tr>
      </tbody>
    </table>
    <button
      type="button" class="button is-primary" v-if="!showed"
      :disabled="!logined"
      @click="showed = true"
    >Create New</button>
    <p v-if="!logined">
      <a @click="login">Log in</a> to create new
    </p>
    <div v-if="logined && showed" class="animated fadeInDown">
      <div class="field">
        <label class="label">Title</label>
        <div class="control">
          <input class="input" type="text" placeholder="Title" v-model="title">
        </div>
        <label class="label">Content</label>
        <div class="control">
          <textarea class="textarea" placeholder="Content" v-model="content">
          </textarea>
        </div>
      </div>
      <div class="field">
        <div class="control">
          <button type="button" class="button is-primary"
            @click="submit"
          >Create New</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  data () {
    return {
      title: '',
      showed: false,
      content: ''
    }
  },
  computed: {
    ...mapGetters([ 'discussesList', 'logined' ])
  },
  created () {
    this.$store.dispatch('fetchDiscussesList')
  },
  methods: {
    ...mapMutations({ login: 'showLoginModal' }),
    submit () {
      if (this.title === '' || this.content === '') {
        this.$store.dispatch('addMessage', {
          body: 'Title and content can not be empty',
          type: 'danger'
        })
        return
      }
      this.$store.dispatch('createDiscuss', {
        title: this.title,
        content: this.content
      }).then(() => {
        this.$store.dispatch('addMessage', {
          body: 'Okay'
        })
      }).catch(() => {
        this.$store.dispatch('addMessage', {
          body: 'Title and content can not be empty',
          type: 'danger'
        })
      })
    }
  }
}
</script>

<style lang="css">
</style>
