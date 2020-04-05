<template>
  <div>
    Shico Voice
    <div>Selected track {{trackNumber}}</div>
    <div id="shicovoicecontroller">
      <input type="button" name="volume-up" value="U" v-on:click="$emit('volume-up')" />
      <label>{{ volume }}</label>
      <input type="button" numa="volume-down" value="D" v-on:click="$emit('volume-down')" />
    </div>
    <div>
      <div>
        Pan L
        <span class="pan">{{panLeft}}</span>:
        <span class="pan">{{panRight}}</span>R
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
