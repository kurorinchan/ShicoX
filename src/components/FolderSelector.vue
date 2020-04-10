<template>
  <div>
    <input id="path-input" type="text" placeholder="フォルダ名" v-model="path" @input="directoryEntered" />
    <input
      id="file-selector"
      name="input-file-selection"
      type="file"
      webkitdirectory
      @input="directorySelected"
    />
    <input type="button" value="選択" onclick="document.getElementById('file-selector').click()" />
  </div>
</template>

<script>
export default {
  name: 'FileSelection',
  props: {
    // May select an initial path set on the input.
    // Setting this does not emit an event for this path.
    initPath: String
  },
  data() {
    return {
      path: this.initPath
    }
  },
  methods: {
    directoryEntered: function(event) {
      this.path = event.target.value
      this.$emit('folder-selected', this.path)
    },
    directorySelected: function(event) {
      this.path = event.target.files[0].path
      this.$emit('folder-selected', this.path)
    }
  }
}
</script>

<style scoped>
#file-selector {
  display: none;
}
</style>