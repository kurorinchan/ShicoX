<template>
  <div id="controls">
    <FolderSelector :initPath="initPath" @folder-selected="folderSelected" />
    <CountDownTimer id="countdowntimer" @new-duration="displayedRemainingTime = $event" />
    <div id="remainingtime">あと{{ displayedRemainingTime }}分</div>
    <ActionButtons
      class="actionbutton"
      @start="start"
      @stop="stop"
      @start-fast="startFast"
      @giveup="giveup"
      @last="last"
    />
    <div id="voicecontrollers">
      <div id="shicovoicecontroller">
        <div class="voice-category">シコシコボイス</div>
        <ShicoVoiceController
          class="voicecontroller"
          :volume="shicoVolume"
          :trackNumber="shicoTrackNumber"
          @volume-change="shicoVolumeChange"
          @pan-change="shicoPanChange"
        />
      </div>
      <div id="ingovoices">
        <div class="voice-category">淫語ボイス</div>
        <div id="ingo-voice-controllers">
          <IngoVoiceController
            class="voicecontroller"
            v-for="item in ingoVoices"
            :key="item.trackNumber"
            :volume="item.volume"
            :pan="item.pan"
            :track-number="item.trackNumber"
            :checked="item.checked"
            @volume-change="ingoVolumeChange"
            @check-change="ingoCheckChange"
            @pan-change="ingoPanChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */

import CountDownTimer from './CountDownTimer.vue'
import ActionButtons from './ActionButtons.vue'
import ShicoVoiceController from './ShicoVoiceController.vue'
import IngoVoiceController from './IngoVoiceController.vue'
import FolderSelector from './FolderSelector.vue'

const asm = require('./AudioStateMachine')
const af = require('./AssetFinder')

const app = require('electron').remote.app

const basepath = app.getAppPath()
let audioResoucePath = ''
if (process.env.NODE_ENV === 'development') {
  audioResoucePath = process.env.VUE_APP_AUDIO_RESOURCE_PATH
}

console.log(basepath)
console.log(process.env)
console.log(audioResoucePath)

// TODO: This conversion is probably not necessary. Remove.
const MIN_TO_SECONDS = 60

const SHICO_INIT_VOLUME = 100
const INIT_VOLUME = 100

export default {
  name: 'Controls',
  components: {
    ActionButtons,
    CountDownTimer,
    ShicoVoiceController,
    IngoVoiceController,
    FolderSelector
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
      shicoVolume,
      initPath: ''
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
    shicoVolumeChange: function(trackNumber, newVolume) {
      const voices = this.shicoVoices.find(function(voices) {
        return voices.trackNumber == trackNumber
      })
      const group = voices.group
      group.setShicoVolume(newVolume)
      this.shicoVolume = group.getShicoVolume()
    },
    shicoPanChange: function(trackNumber, value) {
      const voices = this.shicoVoices.find(function(voices) {
        return voices.trackNumber == trackNumber
      })
      voices.group.setShicoPan(value)
    },
    ingoVolumeChange: function(trackNumber, newVolume) {
      // TODO: Using trackNumber to find the entry in the array is not scalable.
      // Reconsider this if there is a chance this gets large.
      const voices = this.ingoVoices.find(function(voices) {
        return voices.trackNumber == trackNumber
      })
      const group = voices.group
      group.setPharseVolume(newVolume)
      voices.volume = group.getPhraseVolume()
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
    },
    folderSelected: function(directory) {}
  }
}
</script>

<style>
#countdowntimer {
  text-align: center;
}
#remainingtime {
  text-align: center;
}
.actionbutton {
  text-align: center;
}

#voicecontrollers {
  display: grid;
  grid-template-rows: 1fr 1fr;
  column-gap: 10px;
  grid-template-columns: 1fr 2fr;
}

.voicecontroller {
  padding: 4px 10px;
  margin-bottom: 1em;
  background: #ffffff;
  color: #333;
  font-size: 14px;
  font-weight: bold;
  line-height: 1.3em;
  border: 1px dashed rgb(122, 122, 122);
  border-radius: 2px;
  /* box-shadow: 0 0 0 2px #cccccc, 2px 1px 6px 2px rgba(10, 10, 0, 0.5); */
  /* text-shadow: 1px 1px #fff; */
  font-weight: normal;
}

.voice-category {
  text-align: center;
  text-decoration: underline;
  font-weight: bold;
}

#ingo-voice-controllers {
  display: grid;
  grid-template-rows: 1fr 1fr;
  grid-template-columns: 1fr 1fr;
}
</style>