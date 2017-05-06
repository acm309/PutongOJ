<template lang="html">
  <div class="content">
    <h1> <slot name="title"> {{ problem.title }} </slot> </h1>
    <p>Time: {{problem.time}} MS Memory: {{ problem.memory }} KB</p>
    <hr>
    <h3> Description </h3>
    <p v-html="problem.description"></p>
    <h3>Input</h3>
    <p v-html="problem.input"></p>
    <h3>Output</h3>
    <p v-html="problem.output"></p>
    <h3>Sample Input</h3>
    <pre v-html="problem.in"></pre>
    <h3>Sample Output</h3>
    <pre v-html="problem.out"></pre>
    <div v-if="problem.hint">
      <h3>Hint</h3>
      <p v-html="problem.hint"></p>
    </div>

  </div>
</template>

<script>
export default {
  props: ['problem']
}
</script>

<style lang="css">
</style>
