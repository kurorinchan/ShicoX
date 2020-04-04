<template>
  <div id="countdowntimer">
    <input
      class="duration-style"
      type="number"
      min="0"
      step="1"
      v-bind:value="duration"
      v-on:input="$emit('new-duration', $event.target.value)"
    />
    分くらい我慢したい
  </div>
</template>

<script>
export default {
  name: 'CountDownTimer',
  props: {
    // TODO: Remove this props. This is only used as initial value which
    // should be hard coded in this component.
    duration: Number
  }
}
</script>

<style>
.duration-style {
  width: 40px;
}
</style>
