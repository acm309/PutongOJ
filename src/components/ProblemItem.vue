<template lang="html">
  <tr>
    <td></td>
    <td> {{ problem.pid }} </td>
    <td> {{ problem.title }} </td>
    <td> -> </td>
    <td> {{ ratio(problem) }} ({{ problem.solve }} / {{ problem.submit }}) </td>
  </tr>
</template>

<script>
export default {
  props: [ 'problem' ],
  methods: {
    ratio(problem) {
      if (problem.submit === 0) {
        return '0.00%'
      } else {
        return `${(problem.solve / problem.submit).toFixed(2)}%`
      }
    }
  }
}
</script>

<style lang="css">
</style>
