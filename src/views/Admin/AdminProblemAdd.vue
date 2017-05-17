<template lang="html">
  <div>
    <label class="label">Title</label>
    <input class="input" type="text" v-model="title">
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
    <oj-quill @change="descriptionChange"></oj-quill>
    <div class="split-line"></div>
    <label class="label">Input</label>
    <oj-quill @change="inputChange"></oj-quill>
    <div class="split-line"></div>
    <label class="label">Output</label>
    <oj-quill @change="outputChange"></oj-quill>
    <div class="split-line"></div>
    <label class="label">Hint</label>
    <oj-quill @change="hintChange"></oj-quill>
    <div class="split-line"></div>
    <label class="label">Sample Input</label>
    <textarea name="name" rows="8" cols="80" class="textarea code" v-model="sampleInput"></textarea>
    <label class="label">Sample Output</label>
    <textarea name="name" rows="8" cols="80" class="textarea code" v-model="sampleOutput"></textarea>
    <hr>
    <button class="button is-primary" @click="createProblem">Submit</button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import Quill from '../../components/Quill.vue'

export default {
  components: {
    'oj-quill': Quill
  },
  data () {
    return {
      title: '',
      time: 1000,
      memory: 32768,
      description: '',
      input: '',
      output: '',
      sampleInput: '',
      sampleOutput: '',
      hint: ''
    }
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
    createProblem () {
      this.$store.dispatch('createProblem', {
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
          body: `Problem ${this.problem.pid} ${this.problem.title} has been created`
        })
        this.$router.push({
          name: 'problem',
          params: {
            pid: this.problem.pid
          }
        })
      }).catch((err) => {
        this.$store.dispatch('addMessage', {
          body: err.message,
          type: 'danger'
        })
      })
    }
  },
  computed: {
    ...mapGetters([ 'problem' ])
  }
}
</script>

<style lang="css">
</style>
