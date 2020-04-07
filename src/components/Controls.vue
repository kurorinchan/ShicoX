<template>
  <div id="controls">
    <CountDownTimer @new-duration="displayedRemainingTime = $event" />
    あと{{ displayedRemainingTime }}分
    <ActionButtons
      class="actionbutton"
      @start="start"
      @stop="stop"
      @start-fast="startFast"
      @giveup="giveup"
      @last="last"
    />
    <ShicoVoiceController
      class="shicovoicecontroller"
      :volume="shicoVolume"
      :trackNumber="shicoTrackNumber"
      @volume-up="shicoVolumeUp"
      @volume-down="shicoVolumeDown"
      @pan-change="shicoPanChange"
    />
    <IngoVoiceController
      class="ingovoicecontroller"
      v-for="item in ingoVoices"
      :key="item.trackNumber"
      :volume="item.volume"
      :pan="item.pan"
      :track-number="item.trackNumber"
      :checked="item.checked"
      @check-change="ingoCheckChange"
      @volume-up="ingoVolumeUp"
      @volume-down="ingoVolumeDown"
      @pan-change="ingoPanChange"
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

export default {
  name: 'Controls',
  components: {
    ActionButtons,
    CountDownTimer,
    ShicoVoiceController,
    IngoVoiceController
  },
  data() {
    const finder = new af.AssetFinder(audioResoucePath)
    const groups = finder.findAudioAssetGroups()
    const ingoVoices = []
    const shicoVoices = []
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
        trackNumber: group.assetGroupNumber(),
        group
      })
      shicoVoices.push({
        selected: false,
        trackNumber: group.assetGroupNumber(),
        group
      })
    }

    let shicoVolume = SHICO_INIT_VOLUME

    if (groups.length > 0) {
      const firstGroup = groups[0]
      stateMachine.setShicoGroup(firstGroup)
      shicoVoices[0].selected = true
      shicoVolume = firstGroup.getShicoVolume()
    }

    return {
      stateMachine,
      remainingTime: 10 * MIN_TO_SECONDS,
      pan: 'left',
      ingoVoices,
      shicoVoices,
      shicoVolume
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
    shicoTrackNumber: function() {
      const voices = this.shicoVoices.find(function(voices) {
        return voices.selected
      })
      return voices.trackNumber
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
    shicoVolumeUp: function(trackNumber) {
      const voices = this.shicoVoices.find(function(voices) {
        return voices.trackNumber == trackNumber
      })
      const group = voices.group
      group.setShicoVolume(this.shicoVolume + 10)
      this.shicoVolume = group.getShicoVolume()
    },
    shicoVolumeDown: function(trackNumber) {
      const voices = this.shicoVoices.find(function(voices) {
        return voices.trackNumber == trackNumber
      })
      const group = voices.group
      group.setShicoVolume(this.shicoVolume - 10)
      this.shicoVolume = group.getShicoVolume()
    },
    shicoPanChange: function(trackNumber, value) {
      const voices = this.shicoVoices.find(function(voices) {
        return voices.trackNumber == trackNumber
      })
      voices.group.setShicoPan(value)
    },
    ingoCheckChange: function(trackNumber, checked) {
      const voices = this.ingoVoices.find(function(voices) {
        return voices.trackNumber == trackNumber
      })
      voices.checked = checked

      if (!checked) {
        this.stateMachine.removePhraseGroup(voices.group)
        return
      }
      this.stateMachine.addPhraseGroup(voices.group)
    },
    ingoVolumeUp: function(trackNumber) {
      // TODO: Using trackNumber to find the entry in the array is not scalable.
      // Reconsider this if there is a chance this gets large.
      const voices = this.ingoVoices.find(function(voices) {
        return voices.trackNumber == trackNumber
      })
      const group = voices.group
      group.setPharseVolume(group.getPhraseVolume() + 10)
      voices.volume = group.getPhraseVolume()
      console.log(voices.volume)
    },
    ingoVolumeDown: function(trackNumber) {
      const voices = this.ingoVoices.find(function(voices) {
        return voices.trackNumber == trackNumber
      })
      const group = voices.group
      group.setPharseVolume(group.getPhraseVolume() - 10)
      voices.volume = group.getPhraseVolume()
      console.log(voices.volume)
    },
    ingoPanChange: function(trackNumber, value) {
      const voices = this.ingoVoices.find(function(voices) {
        return voices.trackNumber == trackNumber
      })
      voices.group.setPhrasePan(value)
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

<style>
.actionbutton {
  border: solid;
}
.shicovoicecontroller {
  display: inline-block;
  border: solid;
}
.ingovoicecontroller {
  display: inline-block;
  border: solid;
}
</style>