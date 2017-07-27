<template lang="html">
  <nav class="pagination">
    <ul class="pagination-list">
      <li>
        <a
          class="pagination-link"
          @click="pageClick(1)"
          :disabled="pagination.page === 1">
          <i class="fa fa-angle-double-left" aria-hidden="true"></i>
        </a>
      </li>
      <li v-if="pagination.page - distance > 1">
        <span class="pagination-ellipsis">&hellip;</span>
      </li>
      <li v-for="i in distance" v-if="pagination.page - distance - 1 + i >= 1">
        <a
          class="pagination-link"
          @click="pageClick(pagination.page - distance - 1 + i)"
          >{{ pagination.page - distance - 1 + i }}</a>
      </li>
      <li>
        <a
          class="pagination-link is-current"
          @click="pageClick(pagination.page)"
          >{{ pagination.page }}</a>
      </li>
      <li v-for="i in distance" v-if="pagination.page + i <= pagination.pages">
        <a
          class="pagination-link"
          @click="pageClick(pagination.page + i)"
          >{{ pagination.page + i }}</a>
      </li>
      <li v-if="pagination.page + distance < pagination.pages">
        <span class="pagination-ellipsis">&hellip;</span>
      </li>
      <li>
        <a
          class="pagination-link"
          @click="pageClick(pagination.pages)"
          :disabled="pagination.page === pagination.pages">
          <i class="fa fa-angle-double-right" aria-hidden="true"></i>
        </a>
      </li>
    </ul>
  </nav>
</template>

<script>
// the idea of pagination derives from http://acdream.info/problem?pid=1196
export default {
  props: ['pagination'],
  data () {
    return {
      distance: 3
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
