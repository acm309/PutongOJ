<template lang="html">
  <div>
    <table class="table">
      <thead>
        <tr>
          <th>Cid</th> <th>Title</th> <th>Status</th> <th>Start Time</th> <th>Type</th>
        </tr>
      </thead>
      <tfoot>
        <tr>
          <th>Cid</th> <th>Title</th> <th>Status</th> <th>Start Time</th> <th>Type</th>
        </tr>
      </tfoot>
      <tbody>
        <tr
          v-for="contest in contestsList"
          :key="contest.cid"
        >
          <td>{{ contest.cid }}</td>
          <td><a v-if="logined" @click="visitContest(contest)"> {{ contest.title }} </a>
            <a @click="login" v-else>{{ contest.title }}</a>
          </td>
          <td><b>{{ status(contest) }}</b></td>
          <td>{{ contest.start | timePretty }}</td>
          <td>{{ contest.encrypt | encryptPretty }}</td>
        </tr>
      </tbody>
    </table>
    <transition
    enter-active-class="animated fadeInUp"
    leave-active-class="animated fadeOutDown"
    >
      <div class="modal is-active" v-if="active">
        <div class="modal-background" @click="active = false"></div>
        <div class="modal-content box">
          <div class="field">
            <label class="label">This contest has been encrypted with a password.</label>
            <p class="control">
              <input type="password" v-model="pwd" class="input">
            </p>
          </div>
          <button class="button is-primary" @click="verifyPwd">Submit</button>
          <button class="button" @click="active = false">Cancel</button>
        </div>
        <button class="modal-close" @click="active = false"></button>
      </div>
    </transition>
  </div>
</template>

<script>
// TODO 权限检查
export default {
  data () {
    return {
      active: false,
      pwd: ''
    }
  },
  created () {
    document.title = 'Contests'
    this.$store.dispatch('fetchContestsList')
  },
  computed: {
    contestsList () {
      return this.$store.getters.contestsList
    },
    logined () {
      return this.$store.getters.logined
    },
    currentTime () {
      return this.$store.getters.currentTime
    },
    encrypt () {
      return this.$store.getters.encrypt
    },
    contest () {
      return this.$store.getters.contest
    },
    isAdmin () {
      return this.$store.getters.isAdmin
    }
  },
  methods: {
    status (contest) {
      if (this.$store.getters.currentTime < contest.start) {
        return 'Scheduled'
      } else if (this.$store.getters.currentTime > contest.end) {
        return 'Ended'
      }
      return 'Running'
    },
    login () {
      this.$store.commit('showLoginModal')
    },
    visitContest (contest) {
      if (this.isAdmin) {
        this.$router.push({
          name: 'contest',
          params: {
            cid: contest.cid
          }
        })
      }
      this.$store.commit('updateContest', { contest })
      if (this.currentTime < contest.start) {
        this.$store.dispatch('addMessage', {
          body: 'Contest is still on scheduled',
          type: 'warning'
        })
      } else if (contest.encrypt === this.encrypt.Password) {
        this.active = true
      } else if (contest.encrypt === this.encrypt.Private) {
        this.$store.dispatch('verifyArgument', { cid: contest.cid })
          .then(() => {
            this.$router.push({
              name: 'contest',
              params: {
                cid: contest.cid
              }
            })
          })
          .catch((err) => {
            this.$store.dispatch('addMessage', {
              body: err.message,
              type: 'danger'
            })
          })
      } else {
        this.$router.push({
          name: 'contest',
          params: {cid: contest.cid}
        })
      }
    },
    verifyPwd () {
      this.$store.dispatch('verifyArgument', {
        cid: this.contest.cid,
        argument: this.pwd
      }).then(() => {
        this.$router.push({
          name: 'contest',
          params: {
            cid: this.contest.cid
          }
        })
      }).catch((err) => {
        this.$store.dispatch('addMessage', {
          body: err.message,
          type: 'danger'
        })
      })
    }
  }
}
</script>

<style lang="css">
</style>
