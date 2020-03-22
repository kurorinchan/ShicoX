<template>
  <div id="shicovoicecontroller">
    <input type="button" name="volume-up" value="U" v-on:click="$emit('volume-up')" />
    <label>{{ volume }}</label>
    <input type="button" numa="volume-down" value="D" v-on:click="$emit('volume-down')" />
    <input
      type="radio"
      name="pan"
      value="left"
      :checked="pan === 'left'"
      v-on:change="$emit('pan-left')"
    />
    <label>左</label>
    <input
      type="radio"
      name="pan"
      value="center"
      :checked="pan === 'center'"
      v-on:change="$emit('pan-center')"
    />
    <label>中央</label>
    <input
      type="radio"
      name="pan"
      value="right"
      :checked="pan === 'right'"
      v-on:change="$emit('pan-right')"
    />
    <label>右</label>
  </div>
</template>

<script>
export default {
  name: 'ShicoVoiceControler',
  props: {
    volume: Number,
    pan: String
  }
}
</script>
