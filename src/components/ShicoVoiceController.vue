<template>
  <div>
    Shico Voice
    <div>Selected track {{trackNumber}}</div>
    <div>
      <label>
        Volume:
        <span class="labelnumber">{{ volume }}</span>
      </label>

      <input type="button" name="volume-up" value="U" v-on:click="$emit('volume-up', trackNumber)" />
      <input
        type="button"
        name="volume-down"
        value="D"
        v-on:click="$emit('volume-down', trackNumber)"
      />
    </div>
    <div>
      <div>
        Pan L
        <span class="labelnumber">{{panLeft}}</span>:
        <span class="labelnumber">{{panRight}}</span>R
      </div>
      <input
        type="range"
        v-model="panValue"
        min="-50"
        max="50"
        v-on:input="$emit('pan-change', trackNumber, $event.target.value / 50)"
        list="my-detents"
      />
      <datalist id="my-detents">
        <option value="0"></option>
      </datalist>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShicoVoiceControler',
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