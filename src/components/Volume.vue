<template>
  <div id="container">
    <label for="volume-slider" class="unselectable-text">Vol</label>
    <div id="currentvolume" class="unselectable-text">{{currentVolume}}</div>
    <input
      name="volume-slider"
      class="slider"
      type="range"
      v-model="currentVolume"
      min="0"
      max="100"
      v-on:input="$emit('volume-change', $event.target.value)"
      list="detents"
    />
    <!-- This div is a place holder to fill the right gap. -->
    <div />
  </div>
</template>

<script>
export default {
  name: 'Volume',
  data() {
    return {
      currentVolume: 100
    }
  }
}
</script>

<style scoped>
#container {
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 5ch 3ch 1fr 3ch;
}

#currentvolume {
  text-align: center;
}

.slider {
  appearance: none;
  width: 100%;
  height: 10px;
  border-radius: 5px;
  background: #d3d3d3;
  outline: none;
  opacity: 0.7;
  -webkit-transition: 0.2s;
  transition: opacity 0.2s;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #116db9;
  cursor: pointer;
}

.unselectable-text {
  user-select: none;
}
</style>