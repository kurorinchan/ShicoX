import Vue from 'vue'
// import App from './App.vue'
import ShicoX from './ShicoX.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(ShicoX)
}).$mount('#app')
