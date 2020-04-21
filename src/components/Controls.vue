<template>
  <div id="controls">
    <FolderSelector :initPath="initPath" @folder-selected="folderSelected" />
    <AlwaysOnTop @changed="alwaysOnTopToggle" />
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
          :selectableTracks="shicoVoices"
          @track-change="shicoTrackChange"
          @volume-change="shicoVolumeChange"
          @pan-change="shicoPanChange"
        />
      </div>
      <div id="ingovoices">
        <div class="voice-category">淫語ボイス</div>
        <div id="ingo-voice-controllers">
          <IngoVoiceController
            class="voicecontroller ingo-controller"
            v-for="item in ingoVoices"
            :key="item.trackNumber"
            :volume="item.volume"
            :pan="item.pan"
            :track-number="item.trackNumber"
            :checked="item.checked"
            :enabled="item.enabled"
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
import AlwaysOnTop from './AlwaysOnTop.vue'

const { ipcRenderer } = require('electron')

const asm = require('./AudioStateMachine')
const af = require('./AssetFinder')

const app = require('electron').remote.app

const basepath = app.getAppPath()
let audioResoucePath = ''

// For development only, if the environment variable is set, it loads it
// on initialize.
if (process.env.NODE_ENV === 'development') {
  audioResoucePath = process.env.VUE_APP_AUDIO_RESOURCE_PATH
}

console.log(basepath)
console.log(process.env)
console.log(audioResoucePath)

// TODO: This conversion is probably not necessary. Remove.
const MIN_TO_SECONDS = 60

const SHICO_INIT_VOLUME = 75
const INIT_VOLUME = 100

export default {
  name: 'Controls',
  components: {
    ActionButtons,
    CountDownTimer,
    ShicoVoiceController,
    IngoVoiceController,
    FolderSelector,
    AlwaysOnTop
  },
  data() {
    const ingoVoices = []
    const shicoVoices = []
    const stateMachine = new asm.AudioStateMachine()

    // For now, the number of boxes shown by default is 2. This could be
    // dynamically added later (but the grid layout may have to be adjusted).
    for (let i = 0; i < 2; ++i) {
      const trackNumber = i + 1
      ingoVoices.push({
        volume: INIT_VOLUME,
        checked: false,
        trackNumber,
        enabled: false,
        group: null
      })
      shicoVoices.push({
        selected: false,
        trackNumber,
        name: '',
        group: null
      })
    }

    return {
      stateMachine,
      remainingTime: 10 * MIN_TO_SECONDS,
      ingoVoices,
      shicoVoices,
      shicoVolume: SHICO_INIT_VOLUME,
      initPath: audioResoucePath
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
      if (!voices) {
        return 0
      }
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
    shicoTrackChange(newTrackNumber) {
      const voices = this.shicoVoices.find(function(voices) {
        return voices.trackNumber == newTrackNumber
      })
      this.stateMachine.setShicoGroup(voices.group)
    },
    shicoVolumeChange: function(newVolume) {
      // Note that since there is only one volume controller for shico voices,
      // its best to change the volumes for all groups. This way when a
      // different group is selected (i.e. shicoTrackChange happens) the volume
      // is already set.
      for (const voices of this.shicoVoices) {
        voices.group.setShicoVolume(newVolume)
      }
    },
    shicoPanChange: function(value) {
      // Change all of them due to the same reasons as volume.
      for (const voices of this.shicoVoices) {
        voices.group.setShicoPan(value)
      }
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
    folderSelected: function(directory) {
      this.stateMachine.clear()
      const finder = new af.AssetFinder(directory)
      const groups = finder.findAudioAssetGroups()
      const originalVoicesLength = this.ingoVoices.length
      for (const [index, group] of groups.entries()) {
        group.setPharseVolume(INIT_VOLUME)
        group.setShicoVolume(SHICO_INIT_VOLUME)
        this.stateMachine.addPhraseGroup(group)

        const newIngoVoice = {
          volume: group.getPhraseVolume(),
          checked: true,
          trackNumber: group.assetGroupNumber(),
          group,
          enabled: true
        }

        const newShicoVoice = {
          selected: false,
          trackNumber: group.assetGroupNumber(),
          name: 'Track' + group.assetGroupNumber(),
          group
        }

        if (index < originalVoicesLength) {
          Object.assign(this.ingoVoices[index], newIngoVoice)
          Object.assign(this.shicoVoices[index], newShicoVoice)
        } else {
          this.ingoVoices.push(newIngoVoice)
          this.shicoVoices.push(newShicoVoice)
        }
      }

      if (groups.length > 0) {
        const firstGroup = groups[0]
        this.stateMachine.setShicoGroup(firstGroup)
        this.shicoVoices[0].selected = true
        this.shicoVolume = firstGroup.getShicoVolume()
      }
    },
    alwaysOnTopToggle: function(checked) {
      console.log('always on top ', checked)
      ipcRenderer.send('toggle-always-on-top', checked)
    }
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
  grid-template-rows: 1fr;
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
  font-weight: normal;
}

.voice-category {
  text-align: center;
  text-decoration: underline;
  font-weight: bold;
}

/* TODO: Need more CSS to get this flowing.
   This probably does not allow adding a third element. */
#ingo-voice-controllers {
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 1fr 1fr;
}
</style>