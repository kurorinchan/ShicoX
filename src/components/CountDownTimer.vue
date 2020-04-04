<template>
  <div id="countdowntimer">
    <input
      class="duration-style"
      type="number"
      min="0"
      step="1"
      value="10"
      v-on:input="$emit('new-duration', $event.target.value)"
    />
    分くらい我慢したい
  </div>
</template>

<script>
export default {
  name: 'CountDownTimer'
}
</script>

<style>
.duration-style {
  width: 40px;
}
</style>
