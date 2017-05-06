<template lang="html">
  <div class="contest-ranklist">
    <table class="table is-bordered">
      <thead>
        <tr>
          <td>#</td> <td></td> <td>Nick</td> <td>Solve</td> <td>Penalty</td>
          <td v-for="(pid, index) in contest.list"> {{ index }} </td>
        </tr>
      </thead>
      <tr
        v-for="(rank, index) in ranklist"
      >
        <td>{{ index + 1 }}</td>
        <td>{{ rank.uid }}</td>
        <td>{{ rank.nick }}</td>
        <td>{{ rank.solve }}</td>
        <td>{{ rank.penalty | durationPretty }}</td>
        <template
          v-for="pid in contest.list"
        >
          <td v-if="typeof rank.solved[pid] === 'undefined'"></td>
          <td v-else-if="rank.solved[pid].wa >= 0"
              class="is-success"
              :class="{'is-first': rank.solved[pid].isFirst}"
            >
            {{ rank.solved[pid].create | durationPretty }}
            {{ rank.solved[pid].wa === 0 ? '' : `(${rank.solved[pid].wa})` }}
          </td>
          <td v-else class="is-danger">
            {{ rank.solved[pid].wa }}
          </td>
        </template>
      </tr>
      <tbody>

      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  props: ['cid', 'contest'],
  created () {
    this.$store.dispatch('fetchContestRanklist', {
      cid: this.cid
    })
  },
  computed: {
    ranklist () {
      return this.$store.getters.contestRanklist
    }
  }
}
</script>

<style lang="css">
</style>
