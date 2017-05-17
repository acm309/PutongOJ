<template lang="html">
  <div>
    <div class="field has-addons">
      <p class="control">
        <input class="input" type="text" placeholder="Username" v-model="uid">
      </p>
      <p class="control">
        <a
          class="button is-primary"
          :disabled="!uid"
          @click="addUser"
          >
          Add
        </a>
      </p>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Nick</th>
          <th>Remove</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" v-if="user.privilege === privilege.Admin">
          <td>{{ user.uid }}</td>
          <td>{{ user.nick }}</td>
          <td>
            <a
              v-if="user.uid !== 'admin'"
              @click="remove(user)"
            >Remove</a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data () {
    return {
      uid: ''
    }
  },
  created () {
    this.$store.dispatch('fetchUsersList', {
      privilege: this.privilege.Admin
    })
  },
  computed: {
    ...mapGetters({
      users: 'usersList',
      privilege: 'privilege'
    })
  },
  methods: {
    remove (user) {
      user.privilege = this.privilege.PrimaryUser
      this.$store.dispatch('updateUser', Object.assign(user, {
        updateList: true
      }))
    },
    addUser () {
      this.$store.dispatch('updateUser', {
        uid: this.uid,
        privilege: this.privilege.Admin
      }).then(() => {
        this.$store.dispatch('fetchUsersList', {
          privilege: this.privilege.Admin
        })
      })
    }
  }
}
</script>

<style lang="css">
</style>
