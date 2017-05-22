<template lang="html">
  <div>
    <table class="table">
      <thead>
        <th>File</th>
        <th>Download</th>
      </thead>
      <tbody>
        <tr>
          <td>test.in</td>
          <td><a
            :href="url('in')"
            target="_blank"
          >Download</a></td>
        </tr>
        <tr>
          <td>test.out</td>
          <td><a
            :href="url('out')"
            target="_blank"
          >Download</a></td>
        </tr>
      </tbody>
    </table>
    <hr>
      <label class="label">Upload test.in</label>
      <div class="field has-addons">
          <p class="is-expanded control">
            <input type="file" class=""
              ref="in"
            >
          </p>
          <p class="control">
            <button class="button is-primary"
              @click="upload('in')"
              :class="{'is-loading': loading}"
            >Upload</button>
          </p>
        </div>
    <hr>
    <label class="label">Upload test.out</label>
    <div class="field has-addons">
        <p class="is-expanded control">
          <input type="file" class=""
            ref="out"
          >
        </p>
        <p class="control">
          <button class="button is-primary"
            @click="upload('out')"
            :class="{'is-loading': loading}"
          >Upload</button>
        </p>
      </div>
  </div>
</template>

<script>
export default {
  props: ['pid'],
  data () {
    return {
      loading: false
    }
  },
  methods: {
    upload (type) {
      this.loading = true
      const data = new window.FormData()
      data.append('file', this.$refs[type].files[0])
      data.append('type', type)
      this.$store.dispatch('uploadTestData', {
        pid: this.pid,
        type,
        data
      }).then(() => {
        this.$store.dispatch('addMessage', {
          body: `test.${type} has been successfully uploaded`
        })
        this.loading = false
      }).catch((err) => {
        this.$store.dispatch('addMessage', {
          body: err.message
        })
        this.loading = false
      })
    },
    url (type) {
      return `/problems/${this.pid}/testdata?type=${type}`
    }
  }
}
</script>

<style lang="css">
</style>
