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
    <h3>Sample Input
      <a
        class="copy hint--right"
        data-clipboard-target="#sampleInput"
        aria-label="Click to copy"
      ><i class="fa fa-clone" aria-hidden="true"></i></a>
    </h3>
    <pre v-html="problem.in" id="sampleInput"></pre>
    <h3>Sample Output
      <a
        class="copy hint--right"
        data-clipboard-target="#sampleOutput"
        aria-label="Click to copy"
      ><i class="fa fa-clone" aria-hidden="true"></i></a>
    </h3>
    <pre v-html="problem.out" id="sampleOutput"></pre>
    <div v-if="problem.hint">
      <h3>Hint</h3>
      <p v-html="problem.hint"></p>
    </div>

  </div>
</template>

<script>
export default {
  props: ['problem'],
  mounted () {
    new window.Clipboard('.copy')
  }
}
</script>

<style lang="css">
</style>
