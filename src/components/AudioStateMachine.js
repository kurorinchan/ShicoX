/* eslint-disable no-unused-vars */

const assert = require('assert')
const INIT_STATE = Symbol('init')
const START_STATE = Symbol('start')
const FAST_STATE = Symbol('fast')
const START_FAST_STATE = Symbol('startfast')
const NORMAL_STATE = Symbol('normal')
const WAITING_NORMAL_END_STATE = Symbol('waiting-normal-end')
const ABRUPT_STATE = Symbol('abrupt')
const GIVE_UP_STATE = Symbol('giveup')
const LAST_MINUTE_STATE = Symbol('last-minute')
const END_STATE = Symbol('end')
const TERMINAL_STATE = Symbol('terminal')

function stub() {}

// This is an event type that isn't really associated with anything.
// Use this event for passing "no info" to a state handler, e.g. transition
// to a next state that doesn't require any info from the previous.
const NULL_OPERATION_TYPE = Symbol('nullop')
// TODO: Prefix this with "PHRASE_".
const PLAYBACK_COMPLETE_TYPE = Symbol('phrase playback complete')
const SHICO_PLAYBACK_COMPLETE_TYPE = Symbol('shico playback complete')
const MINUTE_COUNT_DOWN_OPERATION_TYPE = Symbol('countdown')

class Operation {
  constructor(type) {
    this.type = type
  }
}

class PlaybackComplete extends Operation {
  constructor(player) {
    super(PLAYBACK_COMPLETE_TYPE)
    this.player = player
  }
}

class ShicoPlaybackComplete extends Operation {
  constructor(player) {
    super(SHICO_PLAYBACK_COMPLETE_TYPE)
    this.player = player
  }
}

class MinuteCountDownEvent extends Operation {
  constructor(timeRemaining) {
    super(MINUTE_COUNT_DOWN_OPERATION_TYPE)
    this.timeRemaining = timeRemaining
  }
}

// in milliseconds
const ONE_MINUTE = 60000

function findPlayerAndRemove(player, players) {
  const index = players.findIndex(function (p) {
    return p.assetGroupNumber == player.assetGroupNumber
  })
  if (index == -1) {
    console.warn(
      'Failed to find player for group ' +
        player.assetGroupNumber +
        ' in the array.'
    )
    return
  }
  players.splice(index, 1)
}

function getPlayerByTypename(group, type) {
  switch (type) {
    case 'end':
      return group.end()
    case 'giveup':
      return group.giveup()
    case 'abrupt':
      return group.abrupt()
    case 'startFast':
      return group.startFast()
    case 'start':
      return group.start()
    case 'phrase':
      return group.phrase()
    case 'lastMinute':
      return group.lastMinute()
    case 'fast':
      return group.fast()
  }
  console.error('Cannot find player type ' + type + ' in group.')
}

class AudioStateMachine {
  constructor() {
    this.duration = 0
    this.shicoGroup = null
    this.shicoPlayer = null
    this.phraseGroups = []
    this.countdownCallback = stub
    this.state = INIT_STATE

    // Currently playing players. Once a playback finishes, it is removed from
    // the list.
    // TODO: Accept multiple players. It would have to keep track of where
    // the player came from (i.e. which group), in order to be able to figure
    // out which group to play from next.
    this.phrasePlayers = []
  }

  setShicoGroup(group) {
    this.shicoGroup = group
  }

  addPhraseGroup(group) {
    this.phraseGroups.push(group)
  }

  removePhraseGroup(group) {}

  // Notifies the callback the time remaining in minutes in "normal" mode.
  set oncountdown(callback) {
    this.countdownCallback = callback
  }

  timerFired(event) {
    if (this.state != NORMAL_STATE) {
      // Timers are only used in NORMAL_STATE. When in other states, don't
      // mess with other states. Assume that it is in a state where the
      // duration shouldn't matter any more.
      this.duration = 0
      return
    }
    if (this.duration > 0) {
      this.duration -= 1
    }
    this.countdownCallback(this.duration)
    this.processNext(new MinuteCountDownEvent(this.duration))
    if (this.duration > 0) {
      setTimeout(this.timerFired.bind(this), ONE_MINUTE)
    }
  }

  // Starts the playback. Pass in the duration in minutes of how long it should
  // stay in the "normal" mode.
  play(duration_in_minutes) {
    this.duration = duration_in_minutes
    if (duration_in_minutes == 0) {
      // TODO: Consider taking the normal path below and in the startHandler
      // check the duration to bypass getting into the next (NORMAL) state.
      // This way if the user wants to hear these voices, they could set it to
      // 0.
      this.state = FAST_STATE
      return
    }
    this.stopAllPlayback()

    this.state = START_STATE
    this.simultaneousPharsePlaybackStart('start')
  }

  playFast() {
    this.stopAllPlayback()
    this.state = START_FAST_STATE
    this.simultaneousPharsePlaybackStart('startFast')
  }

  // TODO: This is not a public function. Move below or somehow organize it
  // to make it obvious.
  abrupt() {
    this.stopAllPlayback()

    this.state = ABRUPT_STATE
    this.simultaneousPharsePlaybackStart('abrupt')
  }

  // TODO: This is giveUp. phraseGroup uses giveup. Go with one not both.
  giveUp() {
    if (this.state != NORMAL_STATE && this.state != WAITING_NORMAL_END_STATE) {
      // This action is only valid while in normal state or waiting for it to
      // end.
      return
    }

    this.stopAllPlayback()

    this.state = GIVE_UP_STATE
    this.simultaneousPharsePlaybackStart('giveup')
  }

  end() {
    if (
      this.state == LAST_MINUTE_STATE ||
      this.state == GIVE_UP_STATE ||
      this.state == END_STATE ||
      this.state == START_FAST_STATE
    ) {
      // These are the states where end() transition is not allowed.
      return
    }

    this.stopAllPlayback()

    if (
      this.state == NORMAL_STATE ||
      this.state == WAITING_NORMAL_END_STATE ||
      this.state == START_STATE
    ) {
      this.abrupt()
      return
    }

    if (this.state != FAST_STATE) {
      return
    }

    this.state = END_STATE
    this.simultaneousPharsePlaybackStart('end')
  }

  stop() {
    this.stopAllPlayback()
    console.log('stop')
    this.state = INIT_STATE
  }

  // Non-public functions.

  simultaneousPharsePlaybackStart(type) {
    assert(this.phrasePlayers.length == 0)
    // All players are put in this array first before playback, since
    // different files may take variable amount of time to load.
    // When they are all ready, they are played all at once.
    const players = []
    for (const group of this.phraseGroups) {
      const player = getPlayerByTypename(group, type)
      this.phrasePlayers.push(player)
      players.push(player)
      player.onplayended = this.completedPhrasePlayback.bind(this)
    }
    for (const player of players) {
      player.play()
    }
  }

  /**
   * The callback should return a player given the group.
   * @callback getPlayerCallback
   * @param {AudioAssetGroup} group
   */

  /**
   * Starts playing a shico voice.
   * When the playback ends completedShicoPlayback is called.
   * If there isn't a shico group currently set, then this function is a NOP.
   * @param {getPlayerCallback} getPlayerCb - Callback applied to the shico
   * group.
   */
  playShico(getPlayerCb) {
    if (!this.shicoGroup) {
      return
    }

    const player = getPlayerCb(this.shicoGroup)
    player.onplayended = this.completedShicoPlayback.bind(this)
    this.shicoPlayer = player
    player.play()
  }

  // This will stop all the players that are playing and will empty the
  // phrasePlayers array and set shicoPlayer to null.
  stopAllPlayback() {
    for (const player of this.phrasePlayers) {
      player.stop()
    }
    this.phrasePlayers = []
    if (this.shicoPlayer) {
      this.shicoPlayer.stop()
    }
    this.shicoPlayer = null
  }

  completedPhrasePlayback(player) {
    findPlayerAndRemove(player, this.phrasePlayers)
    this.processNext(new PlaybackComplete(player))
  }

  completedShicoPlayback(player) {
    this.shicoPlayer = null
    this.processNext(new ShicoPlaybackComplete(player))
  }

  startHandler(event) {
    if (event.type != PLAYBACK_COMPLETE_TYPE) {
      return
    }

    if (this.phrasePlayers.length > 0) {
      // Keep waiting for all players to end.
      return
    }

    this.state = NORMAL_STATE
    if (this.duration > 0) {
      setTimeout(this.timerFired.bind(this), ONE_MINUTE)
    }
    this.processNext(new Operation(NULL_OPERATION_TYPE))
  }

  startFastHandler(event) {
    if (this.phrasePlayers.length > 0) {
      // Keep waiting for all players to end.
      return
    }

    this.state = FAST_STATE
    this.processNext(new Operation(NULL_OPERATION_TYPE))
  }

  findPhraseGroup(assetGroupNumber) {
    return this.phraseGroups.find(function (g) {
      return g.assetGroupNumber() == assetGroupNumber
    })
  }

  // Determines which AudioAssetGroup the player belongs too and then starts
  // playing back the next one in the group.
  playNextOf(player, type) {
    const group = this.findPhraseGroup(player.assetGroupNumber)
    if (!group) {
      console.log('Group ' + player.assetGroupNumber + ' has been removed.')
      // The group has been removed while the player was playing.
      // TODO: Maybe this should be an invariance. IOW when a phrase group
      // is removed, maybe it should stop all the players. Reconsider this
      // logic.
      return
    }
    const nextPlayer = getPlayerByTypename(group, type)
    this.phrasePlayers.push(nextPlayer)
    nextPlayer.onplayended = this.completedPhrasePlayback.bind(this)
    nextPlayer.play()
  }

  // TODO: It's probably better to add more states so that these if statements
  // go away, making the logic more easier to grasp. It is supposed to be
  // linear.
  normalHandler(event) {
    if (event.type == NULL_OPERATION_TYPE) {
      if (this.phrasePlayers.length > 0) {
        console.warn('There should not be any players in this state.')
        this.stopAllPlayback()
      }
      this.simultaneousPharsePlaybackStart('phrase')
      this.playShico((group) => group.shico())
    } else if (event.type == PLAYBACK_COMPLETE_TYPE) {
      this.playNextOf(event.player, 'phrase')
    } else if (event.type == SHICO_PLAYBACK_COMPLETE_TYPE) {
      this.playShico((group) => group.shico())
    } else if (event.type == MINUTE_COUNT_DOWN_OPERATION_TYPE) {
      if (event.timeRemaining > 0) {
        for (const group of this.phraseGroups) {
          // No need to setup a onplayended callback. There is no action to take
          // after this finishes playing, nor is it required to stop it forcefully.
          group.perMinuteNotification(event.timeRemaining).play()
        }
        return
      }
      // Note that the player might still be playing, which is fine.
      // Let it finish and transition to the next state.
      // There should not be any "race condition" even if this handler
      // is running as a separate macrotask from the event handler.
      this.state = WAITING_NORMAL_END_STATE
    }
  }

  waitingNormalEndStateHandler(event) {
    if (event.type != PLAYBACK_COMPLETE_TYPE) {
      return
    }

    if (this.phrasePlayers.length > 0) {
      // Keep waiting for all players to end.
      return
    }

    // Getting here should force shico voice to halt as well.
    this.stopAllPlayback()

    this.state = LAST_MINUTE_STATE
    this.simultaneousPharsePlaybackStart('lastMinute')
  }

  lastMinuteHandler(event) {
    if (event.type != PLAYBACK_COMPLETE_TYPE) {
      return
    }

    if (this.phrasePlayers.length > 0) {
      // Keep waiting for all players to end.
      return
    }

    this.state = FAST_STATE
    this.processNext(new Operation(NULL_OPERATION_TYPE))
  }

  abruptHandler(event) {
    assert(event.type == PLAYBACK_COMPLETE_TYPE)
    // TODO: Determine if this really has to wait for anything. The next state
    // is a terminating state so it might not matter.
    findPlayerAndRemove(event.player, this.phrasePlayers)
    if (this.phrasePlayers.length > 0) {
      return
    }
    this.state = TERMINAL_STATE
  }

  giveUpHandler(event) {
    assert(event.type != MINUTE_COUNT_DOWN_OPERATION_TYPE)
    if (this.phrasePlayers.length > 0) {
      // Keep waiting for all players to end.
      return
    }

    this.state = FAST_STATE
    this.processNext(new Operation(NULL_OPERATION_TYPE))
  }

  fastHandler(event) {
    assert(event.type != MINUTE_COUNT_DOWN_OPERATION_TYPE)
    if (event.type == NULL_OPERATION_TYPE) {
      if (this.phrasePlayers.length > 0) {
        console.warn('There should not be any players in this state.')
        this.stopAllPlayback()
      }

      this.simultaneousPharsePlaybackStart('fast')
      this.playShico((group) => group.shicoFast())
    } else if (event.type == SHICO_PLAYBACK_COMPLETE_TYPE) {
      this.playShico((group) => group.shicoFast())
    } else if (event.type == PLAYBACK_COMPLETE_TYPE) {
      this.playNextOf(event.player, 'fast')
    } else {
      console.warn('Unrecognized event in fastHander ', event)
    }
  }

  endHandler(event) {
    // TODO: Determine if this really has to wait for anything. The next state
    // is a terminating state so it might not matter.
    if (this.phrasePlayers.length > 0) {
      return
    }
    this.state = TERMINAL_STATE
  }

  processNext(event) {
    if (this.state == START_STATE) {
      this.startHandler(event)
    } else if (this.state == START_FAST_STATE) {
      this.startFastHandler(event)
    } else if (this.state == NORMAL_STATE) {
      this.normalHandler(event)
    } else if (this.state == WAITING_NORMAL_END_STATE) {
      this.waitingNormalEndStateHandler(event)
    } else if (this.state == LAST_MINUTE_STATE) {
      this.lastMinuteHandler(event)
    } else if (this.state == GIVE_UP_STATE) {
      this.giveUpHandler(event)
    } else if (this.state == FAST_STATE) {
      this.fastHandler(event)
    } else if (this.state == END_STATE) {
      this.endHandler(event)
    }
  }
}

module.exports = {
  AudioStateMachine,
}
