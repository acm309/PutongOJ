<template>
  <div id="app">
    <navigate></navigate>
    <router-view/>
  </div>
</template>

<script>
import Navigate from '@/components/Navigate'

export default {
  name: 'app',
  components: {
    Navigate
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
