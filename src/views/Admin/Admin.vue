<template lang="html">
  <div class="columns">
    <div class="column is-3">
      <aside class="menu">
        <p class="menu-label">
          General
        </p>
        <p class="menu-label">
          News
        </p>
        <ul class="menu-list">
          <li><router-link
            :to="{name: 'admin_news_list'}"
          >List</router-link></li>
          <li><a>Add</a></li>
        </ul>
        <p class="menu-label">
          Problems
        </p>
        <ul class="menu-list">
          <li><router-link
              :to="{name: 'admin_problems_list'}"
            >List</router-link></li>
          <li><a>Add</a></li>
        </ul>
        <p class="menu-label">
          Contests
        </p>
        <ul class="menu-list">
          <li><router-link
              :to="{name: 'admin_contests_list'}"
            >List</router-link></li>
          <li><a>Add</a></li>
        </ul>
        <p class="menu-label">
          Users
        </p>
        <ul class="menu-list">
          <li><router-link
              :to="{name: 'admin_users_privilege'}"
            >Privilege</router-link></li>
          <li><a>Password</a></li>
        </ul>
      </aside>
    </div>
    <div class="column">
      <router-view
        v-if="self && isAdmin"
      ></router-view>
      <b v-else-if="self">
        You are not an admin
      </b>
      <b
        v-else
      >You should login at least!</b>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    self () {
      return this.$store.getters.self
    },
    isAdmin () {
      return this.$store.getters.isAdmin
    }
  }
}
</script>

<style lang="css">
</style>
