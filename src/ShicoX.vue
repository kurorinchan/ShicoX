<template>
  <div id="shicoapp">
    <p>Greetings! asdf</p>
    <p> {{ path }} </p>
    <Controls/>
  </div>
</template>

<script>
import Controls from './components/Controls.vue'

export default {
  name: 'ShicoX',
  components: {
    Controls
  },
  data () {
    return {
      path: process.env.PORTABLE_EXECUTABLE_DIR
    }
  }
}
</script>

<style>
#shicoapp {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
  width: 600px;
  height: 600px;
  color: red;
}
</style>
