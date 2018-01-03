<template>
  <div id="app">
    <oj-layout>
      <router-view/>
    </oj-layout>
  </div>
</template>

<script>
import Layout from '@/components/Layout'

export default {
  name: 'app',
  components: {
    'oj-layout': Layout
  }
}
</script>

<style>
</style>
