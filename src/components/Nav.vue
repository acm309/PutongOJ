<template lang="html">
  <nav class="nav has-shadow">
    <div class="container">
      <div class="nav-left">
        <router-link
          class="nav-item is-tab is-hidden-mobile"
          :to="{name: 'home'}"
          exact
        >Home</router-link>
        <router-link
          class="nav-item is-tab is-hidden-mobile"
          :to="{name: 'problems'}"
        >Problems</router-link>
        <router-link
          class="nav-item is-tab is-hidden-mobile"
          :to="{name: 'status'}"
        >Status</router-link>
        <router-link
          class="nav-item is-tab is-hidden-mobile"
          :to="{name: 'ranklist'}"
        >Ranklist</router-link>
        <router-link
          class="nav-item is-tab is-hidden-mobile"
          :to="{name: 'contests'}"
        >Contests</router-link>
        <router-link
          class="nav-item is-tab is-hidden-mobile"
          :to="{name: 'faq'}"
        >FAQ</router-link>
      </div>
      <span class="nav-toggle" @click="active = !active">
        <span></span>
        <span></span>
        <span></span>
      </span>
      <div class="nav-right nav-menu" :class="{'is-active': active}">
        <router-link
          class="nav-item is-tab is-hidden-tablet"
          :to="{name: 'home'}"
          @click.native="active = false"
          exact
        >Home</router-link>
        <router-link
          class="nav-item is-tab is-hidden-tablet"
          :to="{name: 'problems'}"
          @click.native="active = false"
        >Problems</router-link>
        <router-link
          class="nav-item is-tab is-hidden-tablet"
          :to="{name: 'status'}"
          @click.native="active = false"
        >Status</router-link>
        <router-link
          class="nav-item is-tab is-hidden-tablet"
          :to="{name: 'ranklist'}"
          @click.native="active = false"
        >Ranklist</router-link>
        <router-link
          class="nav-item is-tab is-hidden-tablet"
          :to="{name: 'contests'}"
          @click.native="active = false"
        >Contests</router-link>
        <router-link
          class="nav-item is-tab is-hidden-tablet"
          :to="{name: 'faq'}"
          @click.native="active = false"
        >FAQ</router-link>
        <router-link
          class="nav-item is-tab"
          v-if="self"
          :to="{name: 'user', params: {uid: self.uid}}"
          @click.native="active = false"
        > {{ self.uid }} </router-link>
        <a
          class="nav-item is-tab"
          @click="showLoginModal"
          v-else="self"
        >Login</a>
        <a class="nav-item is-tab" v-if="self" @click="logout">Log out</a>
        <router-link
          class="nav-item is-tab"
          v-else
          :to="{name: 'register'}"
          @click.native="active = false"
        >Register</router-link>
        <router-link
          class="nav-item is-tab"
          v-if="self && isAdmin"
          :to="{name: 'admin'}"
          @click.native="active = false"
        >Admin</router-link>
      </div>
    </div>
  </nav>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  data () {
    return {
      active: false
    }
  },
  methods: {
    ...mapMutations([ 'showLoginModal' ]),
    logout () {
      const nick = this.self.nick
      this.$store.dispatch('logout')
        .then(() => {
          this.$store.dispatch('addMessage', {
            body: `Goodbye, ${nick}`
          })
        })
    }
  },
  computed: {
    ...mapGetters([ 'self', 'isAdmin' ])
  }
}
</script>

<style lang="css">
</style>
