<template lang="html">
  <div>
    <label class="label">Title</label>
    <input type="text" class="input" placeholder="title" v-model="title">
    <label class="label">Start Time</label>
    <date-picker :date="startDate" :option="option"></date-picker>
    <label class="label">End Time</label>
    <date-picker :date="endDate" :option="option"></date-picker>
    <label class="label">Type</label>
    <div class="select">
      <select v-model="encryptType">
        <option v-for="(value, key) in encrypt" :value="value">{{ key }}</option>
      </select>
    </div>
    <hr>
    <draggable
      v-model="problems" :option="{group: 'pids'}"
    >
      <div v-for="(pid, index) in problems" class="notification">
        <button class="delete" @click="remove(index)"></button>
        {{ pid }} --- {{ pid }}
      </div>
    </draggable>
    <br>
    <div class="field is-grouped">
      <p class="control is-expanded">
        <input class="input" type="number" placeholder="Add a pid" v-model="pid">
      </p>
      <p class="control">
        <a class="button is-primary" @click="addProblem">
          Add
        </a>
      </p>
    </div>
    <hr>
    <button class="button is-primary" @click="createContest">Submit</button>
  </div>
</template>

<script>

import Datepicker from 'vue-datepicker'
import draggable from 'vuedraggable'

export default {
  data () {
    return {
      title: '',
      encryptType: 1,
      pid: 0,
      problems: [
        751,
        752,
        753
      ],
      startDate: {
        time: ''
      },
      endDate: {
        time: ''
      },
      // 更多应该参考 https://github.com/hilongjw/vue-datepicker
      option: {
        type: 'min',
        week: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
        month: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        format: 'YYYY-MM-DD HH:mm',
        placeholder: 'when?',
        inputStyle: {
          'display': 'inline-block',
          'padding': '6px',
          'line-height': '22px',
          'font-size': '16px',
          'border': '2px solid #fff',
          'box-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.2)',
          'border-radius': '2px',
          'color': '#5F5F5F'
        },
        color: {
          header: '#ccc',
          headerText: '#f00'
        },
        buttons: {
          ok: 'Ok',
          cancel: 'Cancel'
        },
        overlayOpacity: 0.5, // 0.5 as default
        dismissible: true // as true as default
      }
    }
  },
  components: {
    'date-picker': Datepicker,
    'draggable': draggable
  },
  computed: {
    encrypt () {
      return this.$store.getters.encrypt
    },
    contest () {
      return this.$store.getters.contest
    }
  },
  methods: {
    addProblem () {
      this.problems.push(this.pid)
    },
    remove (index) {
      this.problems.splice(index, 1)
    },
    createContest () {
      this.$store.dispatch('createContest', {
        title: this.title,
        start: this.startDate.time,
        end: this.endDate.time,
        encrypt: this.encryptType,
        list: this.problems
      }).then(() => {
        this.$router.push({
          name: 'contest',
          params: {
            cid: this.contest.cid
          }
        })
        this.$store.dispatch('addMessage', {
          body: `Contest ${this.contest.cid} -- ${this.contest.title} has been created!`
        })
      })
    }
  }
}
</script>

<style lang="css">
</style>
