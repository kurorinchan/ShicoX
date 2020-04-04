<template>
  <div id="controls">
    <CountDownTimer
      v-bind:duration="displayedRemainingTime"
      v-on:new-duration="displayedRemainingTime = $event"
    />
    {{ remainingTime }}
    <ActionButtons
      v-on:start="start"
      v-on:stop="stop"
      v-on:start-fast="startFast"
      v-on:giveup="giveup"
      v-on:last="last"
    />
    <ShicoVoiceController
      v-bind:volume="shicoVolume"
      v-on:volume-up="shicoVolumeUp"
      v-on:volume-down="shicoVolumeDown"
      v-bind:pan="pan"
    />
    <IngoVoiceController
      v-for="item in ingoVoices"
      :key="item.trackNumber"
      :volume="item.volume"
      :pan="item.pan"
      :track-number="item.trackNumber"
      :checked="item.checked"
      @volume-up="ingoVolumeUp"
      @volume-down="ingoVolumeDown"
    />
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */

import CountDownTimer from './CountDownTimer.vue'
import ActionButtons from './ActionButtons.vue'
import ShicoVoiceController from './ShicoVoiceController.vue'
import IngoVoiceController from './IngoVoiceController.vue'

const asm = require('./AudioStateMachine')
const af = require('./AssetFinder')

const app = require('electron').remote.app

var basepath = app.getAppPath()
var audioResoucePath = basepath
console.log(basepath)

console.log(process.env)

if (process.env.NODE_ENV === 'development') {
  audioResoucePath = process.env.VUE_APP_AUDIO_RESOURCE_PATH
}
console.log(audioResoucePath)

const MIN_TO_SECONDS = 60

const SHICO_KEY = 'shicoAudioTrack'
const SHICO_INIT_VOLUME = 100
const INIT_VOLUME = 100

// TODO: Possibly move all the logic out from here and put it into a separate
// class/object that hold the state. This shoul probably be a slim object.
export default {
  name: 'Controls',
  components: {
    ActionButtons,
    CountDownTimer,
    ShicoVoiceController,
    IngoVoiceController
  },
  data() {
    const appPath = 'file://' + audioResoucePath
    const finder = new af.AssetFinder(audioResoucePath)
    const groups = finder.findAudioAssetGroups()
    const ingoVoices = []
    const stateMachine = new asm.AudioStateMachine()
    for (const [index, group] of groups.entries()) {
      group.setPharseVolume(INIT_VOLUME)
      group.setShicoVolume(SHICO_INIT_VOLUME)
      stateMachine.addPhraseGroup(group)

      // TODO: Consider making AudioAssetGroup the object to be registered.
      // It would require some kind of coordination between these fields that
      // get displayed and the class itself.
      ingoVoices.push({
        volume: group.getPhraseVolume(),
        checked: true,
        pan: 'center',
        trackNumber: group.assetGroupNumber(),
        group
      })
    }

    return {
      stateMachine,
      remainingTime: 10 * MIN_TO_SECONDS,
      appPath: appPath,
      pan: 'left',
      ingoVoices
    }
  },
  computed: {
    displayedRemainingTime: {
      get: function() {
        return Math.floor(this.remainingTime / MIN_TO_SECONDS)
      },
      set: function(minutes) {
        this.remainingTime = minutes * MIN_TO_SECONDS
      }
    },
    shicoVolume: function() {
      return 100
    }
  },
  methods: {
    oncountdown: function(timeRemaining) {
      this.displayedRemainingTime = timeRemaining
    },
    start: function() {
      this.stateMachine.oncountdown = this.oncountdown.bind(this)
      this.stateMachine.play(this.displayedRemainingTime)
    },
    stop: function() {
      this.stateMachine.stop()
    },
    startFast: function() {
      this.stateMachine.playFast()
    },
    shicoVolumeUp: function() {},
    shicoVolumeDown: function() {},
    ingoVolumeUp: function(trackNumber) {
      // TODO: Using trackNumber to find the entry in the array is not scalable.
      // Reconsider this if there is a chance this gets large.
      const voices = this.ingoVoices.find(function(voices) {
        return voices.trackNumber == trackNumber
      })
      const group = voices.group
      group.setPharseVolume(group.getPhraseVolume() + 1)
      voices.volume = group.getPhraseVolume()
      console.log(voices.volume)
    },
    ingoVolumeDown: function(trackNumber) {
      const voices = this.ingoVoices.find(function(voices) {
        return voices.trackNumber == trackNumber
      })
      const group = voices.group
      group.setPharseVolume(group.getPhraseVolume() - 1)
      voices.volume = group.getPhraseVolume()
      console.log(voices.volume)
    },
    giveup: function() {
      this.stateMachine.giveUp()
    },
    last: function() {
      // shasei button.
      this.stateMachine.end()
    }
  }
}
</script>
