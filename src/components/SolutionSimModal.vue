<template lang="html">
  <div>
    <transition
      name="custom-classes-transition"
      enter-active-class="animated fadeInUp"
      leave-active-class="animated fadeOutDown"
    >
      <div class="modal is-active" v-if="active">
        <div class="modal-background" @click="closeSim"></div>
        <div
          class="modal-content box sim-modal"
          v-if="solution && sim_solution">
          <div>
            Author: <router-link
              @click.native="closeSim"
              :to="{name: 'user', params: { uid: solution.uid }}"
            >{{ solution.uid }}</router-link>
            <pre>
              <code v-html="code(solution)"></code>
            </pre>
          </div>
          <div>
            Author: <router-link
              @click.native="closeSim"
              :to="{name: 'user', params: { uid: sim_solution.uid }}"
            >{{ sim_solution.uid }}</router-link>
            <pre>
              <code v-html="code(sim_solution)"></code>
            </pre>
          </div>
        </div>
        <button class="modal-close" @click="closeSim"></button>
      </div>
    </transition>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  data () {
    return {
      solution: null,
      sim_solution: null
    }
  },
  computed: {
    ...mapGetters({
      active: 'solutionSimActive',
      sid: 'sid',
      sim_s_id: 'sim_s_id'
    })
  },
  methods: {
    ...mapMutations([ 'closeSim' ]),
    code (solution) {
      if (solution.error) {
        return window.hljs.highlightAuto(`/**\n${solution.error}\n*/\n${solution.code}`).value
      }
      return window.hljs.highlightAuto(solution.code).value
    }
  },
  watch: {
    'active' (to, from) {
      if (to) {
        Promise.all([
          this.$store.dispatch('fetchSolution', { sid: this.sid }),
          this.$store.dispatch('fetchSolution', { sid: this.sim_s_id })
        ]).then((data) => {
          this.solution = data[0]
          this.sim_solution = data[1]
        })
      }
    }
  }
}
</script>

<style lang="css">
</style>
