<template lang="html">
  <nav class="pagination">
    <ul class="pagination-list">
      <li>
        <a
          @click="pageClick(1)"
          class="pagination-link"
          :class="{'is-current': 1 === pagination.page}"
        > 1 </a>
      </li>
      <!--  1 ... 4 5 6 ... 9 (current 5) -->
      <li v-if="pagination.page - 1 >= distance + 1">
        <span class="pagination-ellipsis">&hellip;</span>
      </li>
      <li v-if="pagination.page - 1 > 1">
        <a
          class="pagination-link"
          @click="pageClick(pagination.page - 1)"
        >{{ pagination.page - 1 }}</a>
      </li>
      <li v-if="pagination.page !== 1 && pagination.page !== pagination.pages">
        <a
          class="pagination-link is-current"
          @click="pageClick(pagination.page)"
        >{{ pagination.page }}</a>
      </li>
      <li v-if="pagination.page + 1 < pagination.pages">
        <a
          class="pagination-link"
          @click="pageClick(pagination.page + 1)"
        >{{ pagination.page + 1 }}</a>
      </li>
      <li v-if="pagination.pages - pagination.page >= distance + 1">
        <span class="pagination-ellipsis">&hellip;</span>
      </li>
      <li v-if="pagination.pages !== 1">
        <a
          class="pagination-link"
          @click="pageClick(pagination.pages)"
          :class="{'is-current': pagination.pages === pagination.page}"
        >{{ pagination.pages }}</a>
      </li>
    </ul>
  </nav>
</template>

<script>
export default {
  props: ['pagination', 'pageGen'],
  data () {
    return {
      distance: 2
    }
  },
  methods: {
    pageClick (page) {
      this.$emit('pageClick', page)
    }
  }
}
</script>

<style lang="css">
</style>
