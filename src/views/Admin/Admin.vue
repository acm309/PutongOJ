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
            exact
          >List</router-link></li>
          <li><router-link
            :to="{name: 'admin_news_add'}"
          >Add</router-link></li>
        </ul>
        <p class="menu-label">
          Problems
        </p>
        <ul class="menu-list">
          <li><router-link
              :to="{name: 'admin_problems_list'}"
              exact
            >List</router-link></li>
          <li><router-link
              :to="{name: 'admin_problems_add'}"
            >Add</router-link></li>
        </ul>
        <p class="menu-label">
          Contests
        </p>
        <ul class="menu-list">
          <li><router-link
              :to="{name: 'admin_contests_list'}"
              exact
            >List</router-link></li>
          <li><router-link
              :to="{name: 'admin_contests_add'}"
            >Add</router-link></li>
      </ul>
        <p class="menu-label">
          Users
        </p>
        <ul class="menu-list">
          <li><router-link
              :to="{name: 'admin_users_privilege'}"
            >Privilege</router-link></li>
          <li><router-link
              :to="{name: 'admin_users_password'}"
            >Password</router-link></li>
        </ul>
      </aside>
    </div>
    <div class="column">
      <router-view
        v-if="self && isAdmin"
      ></router-view>
      <strong v-else>
        You are not allowed to visit this page
      </strong>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters([
      'self',
      'isAdmin',
      'logined'
    ])
  }
}
</script>

<style lang="css">
</style>
