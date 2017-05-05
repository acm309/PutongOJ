<template lang="html">
  <div class="modal is-active">
    <div class="modal-background" @click="close"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title"><slot></slot></p>
        <button class="delete" @click="close"></button>
      </header>
      <section class="modal-card-body">
        <div class="select">
          <select v-model="language">
            <option
              v-for="(lang, code) in LANGUAGES"
              :value="code"
            >{{ lang }}</option>
          </select>
        </div>
        <textarea name="name" rows="18" cols="80" class="textarea code" v-model="code">

        </textarea>
      </section>
      <footer class="modal-card-foot">
        <a class="button is-primary" @click="submit">Submit</a>
        <a class="button" @click="close">Cancel</a>
      </footer>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      code: '',
      language: 1
    }
  },
  methods: {
    close () {
      this.$emit('close')
    },
    submit () {
      this.$emit('submit')
    }
  },
  computed: {
    LANGUAGES () {
      return this.$store.getters.languages
    }
  }
}
</script>

<style lang="css">
</style>
