<template>
  <div class="container">
    <label id="panlabel" for="pan-slider" class="unselectable-text">Pan</label>
    <div id="Llabel" class="unselectable-text label-text">L</div>
    <div id="panrange">
      <input
        name="pan-slider"
        class="slider"
        type="range"
        value="0"
        min="-50"
        max="50"
        v-on:input="$emit('pan-change', $event.target.value / 50)"
        list="detents"
      />
      <datalist id="detents">
        <option value="0"></option>
      </datalist>
    </div>
    <div id="Rlabel" class="unselectable-text label-text">R</div>
  </div>
</template>

<script>
export default {
  name: 'Pan',
  data() {
    return {}
  }
}
</script>

<style scoped>
.container {
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 5ch 3ch 1fr 3ch;
  grid-template-areas: 'label left-label slider right-label';
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
  background: #4caf50;
  cursor: pointer;
}

#panlabel {
  grid-area: label;
}

#Llabel {
  grid-area: left-label;
}

#panrange {
  grid-area: slider;
}

#Rlabel {
  grid-area: right-label;
}

.unselectable-text {
  user-select: none;
}
.label-text {
  text-align: center;
}
</style>