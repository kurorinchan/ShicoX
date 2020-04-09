import Vue from 'vue'
import ShicoX from './ShicoX.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(ShicoX)
}).$mount('#app')
