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
          exact
        >Problems</router-link>
        <router-link
          class="nav-item is-tab is-hidden-mobile"
          :to="{name: 'status'}"
          exact
        >Status</router-link>
        <router-link
          class="nav-item is-tab is-hidden-mobile"
          :to="{name: 'ranklist'}"
          exact
        >Ranklist</router-link>
        <router-link
          class="nav-item is-tab is-hidden-mobile"
          :to="{name: 'contests'}"
          exact
        >Contests</router-link>
        <router-link
          class="nav-item is-tab is-hidden-mobile"
          :to="{name: 'faq'}"
          exact
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
        <a class="nav-item is-tab">Emerald</a>
        <a class="nav-item is-tab">Log out</a>
        <a class="nav-item is-tab">Admin</a>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
}
</script>

<style lang="css">
</style>
