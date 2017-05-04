<template lang="html">
  <tr>
    <td>{{ solution.sid }}</td>
    <td>{{ solution.pid }}</td>
    <td>{{ solution.uid }}</td>
    <td>{{ solution.judge }}</td>
    <td>{{ solution.time }} MS</td>
    <td>{{ solution.memory }} KB</td>
    <td>{{ solution.language }}</td>
    <td>{{ solution.length }} B</td>
    <td>{{ solution.create | timePretty }}</td>
  </tr>
</template>

<script>
export default {
  props: ['solution']
}
</script>

<style lang="css">
</style>
