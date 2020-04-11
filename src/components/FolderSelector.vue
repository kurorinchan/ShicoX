<template>
  <div>
    <input
      id="path-input"
      type="text"
      placeholder="フォルダ名"
      v-model="path"
      @keyup.enter="directoryEntered"
    />
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
    // Setting this will emit an event on initialization, as if the path
    // had been set by the user.
    initPath: String
  },
  data() {
    if (this.initPath) {
      this.emitFolderPathSetEvent(this.initPath)
    }
    return {
      path: this.initPath
    }
  },
  methods: {
    directoryEntered: function(event) {
      // TODO: Validate that the entered path is a directory. If not
      // put a warning next to the inputs.
      this.path = event.target.value
      this.emitFolderPathSetEvent(this.path)
    },
    directorySelected: function(event) {
      console.log(event)
      if (event.target.files.length == 0) {
        // Somehow this happens when the user opens the dialog but doesn't
        // choose anything. Ignore these events.
        return
      }
      this.path = event.target.files[0].path
      this.emitFolderPathSetEvent(this.path)
    },
    emitFolderPathSetEvent: function(directory) {
      this.$emit('folder-selected', directory)
    }
  }
}
</script>

<style scoped>
#file-selector {
  display: none;
}
</style>