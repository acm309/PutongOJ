<template lang="html">
  <div>
    <label class="label">Title</label>
    <input type="text" class="input" v-model="title">
    <label class="label">Time</label>
    <div class="field is-grouped">
      <p class="control is-expanded">
        <input class="input" type="number" placeholder="Time" v-model="time">
      </p>
      <p class="control">
        MS
      </p>
    </div>
    <label class="label">Time</label>
    <div class="field is-grouped">
      <p class="control is-expanded">
        <input class="input" type="number" placeholder="Memory" v-model="memory">
      </p>
      <p class="control">
        KB
      </p>
    </div>
    <label class="label">Description</label>
    <oj-quill @change="descriptionChange" :initContent="problem.description"></oj-quill>
    <div class="split-line"></div>
    <label class="label">Input</label>
    <oj-quill @change="inputChange" :initContent="problem.input"></oj-quill>
    <div class="split-line"></div>
    <label class="label">Output</label>
    <oj-quill @change="outputChange" :initContent="problem.output"></oj-quill>
    <div class="split-line"></div>
    <label class="label">Hint</label>
    <oj-quill @change="hintChange" :initContent="problem.hint"></oj-quill>
    <div class="split-line"></div>
    <label class="label">Sample Input</label>
    <textarea name="name" rows="8" cols="80" class="textarea code" v-model="sampleInput"></textarea>
    <label class="label">Sample Output</label>
    <textarea name="name" rows="8" cols="80" class="textarea code" v-model="sampleOutput"></textarea>
    <hr>
    <button class="button is-primary" @click="updateProblem">Submit</button>
  </div>
</template>

<script>

import Quill from '../../components/Quill.vue'

export default {
  components: {
    'oj-quill': Quill
  },
  props: ['pid'],
  data () {
    return {
      title: '',
      time: 0,
      memory: '',
      description: '',
      input: '',
      output: '',
      sampleInput: '',
      sampleOutput: ''
    }
  },
  created () {
    this.$store.dispatch('fetchProblem', {
      pid: this.pid
    }).then(() => {
      this.title = this.problem.title
      this.time = this.problem.time
      this.memory = this.problem.memory
      this.description = this.problem.description
      this.input = this.problem.input
      this.output = this.problem.output
      this.sampleInput = this.problem.in
      this.sampleOutput = this.problem.out
    })
  },
  methods: {
    descriptionChange (text) {
      this.description = text
    },
    inputChange (text) {
      this.input = text
    },
    outputChange (text) {
      this.output = text
    },
    hintChange (text) {
      this.hint = text
    },
    updateProblem () {
      this.$store.dispatch('updateProblem', {
        pid: this.pid,
        description: this.description,
        input: this.input,
        output: this.output,
        in: this.sampleInput,
        out: this.sampleOutput,
        hint: this.hint,
        title: this.title,
        time: this.time,
        memory: this.memory
      }).then(() => {
        this.$store.dispatch('addMessage', {
          body: `Problem ${this.problem.pid} ${this.problem.title} has been updated`
        })
        this.$router.push({
          name: 'problem',
          params: {
            pid: this.problem.pid
          }
        })
      })
    }
  },
  computed: {
    problem () {
      return this.$store.getters.problem
    }
  }
}
</script>

<style lang="css">
</style>
