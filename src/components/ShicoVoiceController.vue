<template>
  <div>
    <select @change="trackChange">
      <option v-for="track in tracks" :key="track.trackNumber" :value="track.trackNumber">{{track.name}}</option>
    </select>
    <!-- It is probably a better design to also emit the track number of the selected track. But it's YAGNI atm. -->
    <Volume :initVolume="volume" @volume-change="$emit('volume-change', $event)" />
    <Pan @pan-change="$emit('pan-change', $event)" />
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
    // This be an array of objects. The object must at least have the following
    // properties:
    // - trackNumber: A unique identifier among the array.
    // - name: The name displayed on the drop down.
    // When there is a selection change (e.g. by the user) the entire object
    // is emitted as a 'track-change' event.
    selectableTracks: {
      type: Array,
      default: () => []
    }
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
    },
    tracks: function() {
      const tracks = this.selectableTracks
      return tracks.filter(track => track.name)
    }
  },
  methods: {
    trackChange: function(event) {
      const select = event.srcElement
      this.$emit('track-change', select.options[select.selectedIndex].value)
    }
  }
}
</script>

<style scoped>
.tracknumber {
  text-decoration: underline;
}

.unselectable-text {
  user-select: none;
}
</style>