<template>
  <div id="controls">
    <CountDownTimer
      v-bind:duration="displayedRemainingTime"
      v-on:new-duration="displayedRemainingTime = $event"
    />
    {{ remainingTime }}
    <ActionButtons v-on:start="start" v-on:stop="stop" v-on:start-fast="startFast" />
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
      @voluem-down="ingoVolumeDown"
    />
  </div>
</template>

<script>
import CountDownTimer from './CountDownTimer.vue'
import ActionButtons from './ActionButtons.vue'
import ShicoVoiceController from './ShicoVoiceController.vue'
import IngoVoiceController from './IngoVoiceController.vue'

const app = require('electron').remote.app
const path = require('path')

var basepath = app.getAppPath()
var audioResoucePath = basepath
console.log(basepath)

console.log(process.env)

if (process.env.NODE_ENV === 'development') {
  audioResoucePath = process.env.VUE_APP_AUDIO_RESOURCE_PATH
}
console.log(audioResoucePath)

const MIN_TO_SECONDS = 60

class Player {
  constructor (volume, loop) {
    this.audio = null
    this.volume = volume
    this.loop = loop
  }

  set (file) {
    this.file = file
    if (this.audio) {
      this.audio.pause()
    }
    this.audio = new Audio(file)
    this.audio.loop = this.loop
    this.audio.volume = this.volume / 100
    this.audio.play()
  }

  changeVolume (diff) {
    this.volume += diff
    this.volume = Math.max(0, Math.min(100, this.volume))
    if (this.audio) { this.audio.volume = this.volume / 100 }
  }

  play () {
    if (this.audio) { this.audio.play() }
  }

  pause () {
    if (this.audio) { this.audio.pause() }
  }
}

const SHICO_KEY = 'shicoAudioTrack'
const SHICO_INIT_VOLUME = 75
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
  data () {
    const appPath = 'file://' + audioResoucePath
    const shicoPlayer = new Player(SHICO_INIT_VOLUME, true)

    var players = {}
    players[SHICO_KEY] = shicoPlayer

    // Come up with a way to associate player name and the ingoVoice objects
    // below.
    for (let i = 1; i <= 2; i++) {
      const player = new Player(INIT_VOLUME, false)
      players['player' + i] = player
    }

    return {
      remainingTime: 10 * MIN_TO_SECONDS,
      players: players,
      appPath: appPath,
      pan: 'left',
      ingoVoices: [
        {
          volume: 100,
          checked: true,
          pan: 'center',
          trackNumber: 1,
          playerName: 'player1'
        },
        {
          volume: 100,
          checked: false,
          pan: 'center',
          trackNumber: 2,
          playerName: 'player2'
        }
      ]
    }
  },
  computed: {
    displayedRemainingTime: {
      get: function () {
        return Math.floor(this.remainingTime / MIN_TO_SECONDS)
      },
      set: function (minutes) {
        this.remainingTime = minutes * MIN_TO_SECONDS
      }
    },
    shicoVolume: function () {
      return this.players[SHICO_KEY].volume
    }
  },
  methods: {
    start: function () {
      const file = path.join(this.appPath, 'shiko01', 'nomal', '01.wav')
      this.stop()
      const player = this.players[SHICO_KEY]
      player.set(file)
      player.play()

      for (const ingoVoice of this.ingoVoices) {
        if (!ingoVoice.checked) {
          continue
        }
        const player = this.players[ingoVoice.playerName]
        const file = path.join(this.appPath, 'voice01', 'nomal_s', 'v01.wav')
        player.set(file)
        player.play()
      }
    },
    stop: function () {
      for (const [, player] of Object.entries(this.players)) {
        player.pause()
      }
    },
    startFast: function () {
      const file = path.join(this.appPath, 'shiko01', 'fast', 'f92.wav')
      this.stop()
      const player = this.players[SHICO_KEY]
      player.set(file)
      player.play()
    },
    shicoVolumeUp: function () {
      this.players[SHICO_KEY].changeVolume(5)
    },
    shicoVolumeDown: function () {
      this.players[SHICO_KEY].changeVolume(-5)
    },
    ingoVolumeUp: function (entry) {
      const playerName = 'player' + entry.trackNumber
      const player = this.players[playerName]
      player.changeVolume(5)
    },
    ingoVolumeDown: function (entry) {
      const playerName = 'player' + entry.trackNumber
      const player = this.players[playerName]
      player.changeVolume(-5)
    }
  }
}
</script>
