<template>
  <div>
    <label for="alwaystop-checkbox">常に最前面に表示</label>
    <input
      name="alwaystop-checkbox"
      type="checkbox"
      v-model="checked"
      v-on:change="$emit('changed', checked)"
    />
  </div>
</template>

<script>
export default {
  data() {
    return {
      checked: false
    }
  }
}
</script>