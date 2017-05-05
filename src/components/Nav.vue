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
      <span class="nav-toggle">
        <span></span>
        <span></span>
        <span></span>
      </span>
      <div class="nav-right nav-menu">
        <a class="nav-item is-tab is-hidden-tablet is-active">Home</a>
        <a class="nav-item is-tab is-hidden-tablet">Problems</a>
        <a class="nav-item is-tab is-hidden-tablet">Status</a>
        <a class="nav-item is-tab is-hidden-tablet">Ranklist</a>
        <a class="nav-item is-tab is-hidden-tablet">Contests</a>
        <a class="nav-item is-tab is-hidden-tablet">FAQ</a>
        <a class="nav-item is-tab" @click="showLoginModal">Login</a>
        <a class="nav-item is-tab">Log out</a>
        <a class="nav-item is-tab">Admin</a>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  methods: {
    showLoginModal () {
      this.$store.commit('showLoginModal')
    }
  }
}
</script>

<style lang="css">
</style>
