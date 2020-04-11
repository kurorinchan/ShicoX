<template>
  <div id="ingovoicecontroller">
    <div class="unselectable-text tracknumber">台詞{{trackNumber}}</div>
    <div id="playcheck">
      <label for="play-checkbox" class="unselectable-text">Play</label>
      <input
        id="checkbox"
        name="play-checkbox"
        type="checkbox"
        :checked="checked"
        :disabled="!enabled"
        v-on:change="$emit('check-change', trackNumber, !checked)"
      />
    </div>
    <Volume @volume-change="$emit('volume-change', trackNumber, $event)" />
    <Pan @pan-change="$emit('pan-change', trackNumber, $event)" />
  </div>
</template>

<script>
import Pan from './Pan.vue'
import Volume from './Volume.vue'

export default {
  name: 'IngoVoiceController',
  components: { Pan, Volume },
  props: {
    volume: Number,
    pan: Number,
    trackNumber: Number,
    checked: Boolean,
    enabled: Boolean
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
#ingovoicecontroller {
  display: grid;
  grid-template-rows: 1fr 1fr 1fr 1fr;
  grid-template-columns: 1fr;
  row-gap: 0px;
}

#checkbox {
  text-align: center;
}

/* TODO: This layout should be shared with other components */
#playcheck {
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 5ch 3ch 1fr 3ch;
}

.tracknumber {
  text-decoration: underline;
}

.unselectable-text {
  user-select: none;
}
</style>