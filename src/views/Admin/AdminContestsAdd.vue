<template lang="html">
  <div>
    <label class="label">Title</label>
    <input type="text" class="input" placeholder="title">
    <label class="label">Start Time</label>
    <date-picker :date="startDate" :option="option"></date-picker>
    <label class="label">End Time</label>
    <date-picker :date="endDate" :option="option"></date-picker>
    <label class="label">Type</label>
    <div class="select">
      <select>
        <option>Public</option>
        <option>Password</option>
        <option>Private</option>
      </select>
    </div>
    <hr>
    <draggable
      v-model="problems" :option="{group: 'pids'}"
    >
      <div v-for="pid in problems" class="notification">
        {{ pid }}
      </div>
    </draggable>
    <br>
    <div class="field is-grouped">
      <p class="control is-expanded">
        <input class="input" type="text" placeholder="Add a pid">
      </p>
      <p class="control">
        <a class="button is-primary">
          Add
        </a>
      </p>
    </div>
    <hr>
    <button class="button is-primary">Submit</button>
  </div>
</template>

<script>

import Datepicker from 'vue-datepicker'
import draggable from 'vuedraggable'

export default {
  data () {
    return {
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
      option: {
        type: 'min',
        week: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
        month: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        format: 'YYYY-MM-DD hh:mm',
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
  }
}
</script>

<style lang="css">
</style>
