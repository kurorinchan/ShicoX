<template>
  <div id="ingovoicecontroller">
    <div>
      <label>{{ volume }}</label>
      <input type="button" name="volume-up" value="U" v-on:click="$emit('volume-up', trackNumber)" />
      <input
        type="button"
        name="volume-down"
        value="D"
        v-on:click="$emit('volume-down', trackNumber)"
      />
    </div>
    <div>
      <input type="checkbox" :checked="checked" />
      <label>台詞{{trackNumber}}</label>
    </div>
    <div>
      <input type="radio" value="left" :checked="pan === 'left'" v-on:change="$emit('pan-left')" />
      <label>左</label>
      <input
        type="radio"
        value="center"
        :checked="pan === 'center'"
        v-on:change="$emit('pan-center')"
      />
      <label>中央</label>
      <input type="radio" value="right" :checked="pan === 'right'" v-on:change="$emit('pan-right')" />
      <label>右</label>
    </div>
  </div>
</template>

<script>
export default {
  name: 'IngoVoiceController',
  props: ['volume', 'pan', 'trackNumber', 'checked']
}
</script>
