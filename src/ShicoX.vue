<template>
  <div id="shicoapp">
    <Controls />
  </div>
</template>

<script>
import Controls from './components/Controls.vue'

export default {
  name: 'ShicoX',
  components: {
    Controls
  },
  data() {
    return {}
  }
}
</script>

<style>
#shicoapp {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* margin-top: 60px; */
  width: 600px;
  height: 600px;
}
</style>
