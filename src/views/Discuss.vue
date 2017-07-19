<template lang="html">
  <div v-if="discuss">
    <h1 class="title is-2">{{ discuss.title }}</h1>
    <hr>
    <article class="media" v-for="comment in commentsList">
      <div class="media-content">
        <div class="content">
          <p>
            <strong>{{ comment.uid }}</strong>
            <span class="is-pulled-right"> {{ comment.create | timeFromNow }}</span>
            <br>
            {{ comment.content }}
          </p>
        </div>
      </div>
    </article>
    <article class="media">
      <div class="media-content">
        <div class="field">
          <p class="control">
            <textarea class="textarea" placeholder="Add a comment..." v-model="comment"></textarea>
          </p>
        </div>
        <div class="field">
          <p class="control">
            <button
              class="button is-primary"
              :disabled="!logined"
              :class="{'is-loading': loading}"
              @click="submit"
            >Post comment</button>
          </p>
          <p v-if="!logined">
            <a @click="login">Login in</a> to post
          </p>
        </div>
      </div>
    </article>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  data () {
    return {
      comment: '',
      loading: false
    }
  },
  props: ['did'],
  created () {
    this.$store.dispatch('fetchCommentsList', { did: this.did })
  },
  computed: {
    ...mapGetters(['discuss', 'commentsList', 'logined'])
  },
  methods: {
    ...mapMutations({ login: 'showLoginModal' }),
    submit () {
      if (this.comment === '') {
        this.$store.dispatch('addMessage', {
          body: 'comment should not be empty',
          type: 'danger'
        })
        return
      }
      this.loading = true
      this.$store.dispatch('createComment', {
        content: this.comment,
        did: this.did
      }).then(() => this.$store.dispatch('fetchCommentsList', { did: this.did }))
        .catch((err) => {
          this.$store.dispatch('addMessage', {
            body: err.message,
            type: 'danger'
          })
        })
        .then(() => {
          this.loading = false
        })
    }
  }
}
</script>

<style lang="css">
</style>
