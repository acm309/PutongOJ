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
          <td><b :class="`is-contest-${status(contest)}`">{{ status(contest) }}</b></td>
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
import { mapGetters, mapMutations } from 'vuex'

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
    ...mapGetters([
      'contestsList',
      'logined',
      'currentTime',
      'encrypt',
      'contest',
      'isAdmin',
      'self'
    ])
  },
  methods: {
    ...mapMutations({ login: 'showLoginModal' }),
    goToContest (cid) {
      this.$router.push({
        name: 'contest',
        params: { cid }
      })
    },
    status (contest) {
      if (this.$store.getters.currentTime < contest.start) {
        return 'Scheduled'
      } else if (this.$store.getters.currentTime > contest.end) {
        return 'Ended'
      }
      return 'Running'
    },
    visitContest (contest) {
      // Admin 或 已经验证过了
      if (this.isAdmin || this.self.verifiedContests.indexOf(contest.cid) !== -1) {
        this.goToContest(contest.cid)
        return
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
            this.goToContest(contest.cid)
            this.$store.commit('addVerifiedContest', contest)
          })
          .catch((err) => {
            this.$store.dispatch('addMessage', {
              body: err.message,
              type: 'danger'
            })
          })
      } else {
        this.goToContest(contest.cid)
        this.$store.commit('addVerifiedContest', contest)
      }
    },
    verifyPwd () {
      this.$store.dispatch('verifyArgument', {
        cid: this.contest.cid,
        argument: this.pwd
      }).then(() => {
        this.goToContest(this.contest.cid)
        this.$store.commit('addVerifiedContest', this.contest)
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
