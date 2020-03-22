<template>
  <div id="countdowntimer">
    <input
      class="duration-style"
      type="text"
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
    duration: Number
  }
}
</script>

<style>
.duration-style {
  width: 40px;
}
</style>
