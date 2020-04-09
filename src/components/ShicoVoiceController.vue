<template>
  <div>
    <div>Selected track {{trackNumber}}</div>
    <Volume @volume-change="$emit('volume-change', trackNumber, $event)" />
    <Pan @pan-change="$emit('pan-change', trackNumber, $event)" />
  </div>
</template>

<script>
import Pan from './Pan.vue'
import Volume from './Volume.vue'

export default {
  name: 'ShicoVoiceControler',
  components: {
    Pan,
    Volume
  },
  props: {
    volume: Number,
    trackNumber: Number
  },
  data() {
    return {
      panValue: 0
    }
  },
  computed: {
    panLeft: function() {
      return 50 - this.panValue
    },
    panRight: function() {
      return parseInt(this.panValue) + 50
    }
  }
}
</script>

<style scoped>
.labelnumber {
  display: inline-block;
  width: 4ch;
}
</style>