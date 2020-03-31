/* eslint-disable no-unused-vars */

const assert = require('assert')
const INIT_STATE = Symbol('init')
const FAST_STATE = Symbol('fast')
const START_FAST_STATE = Symbol('startfast')
const START_STATE = Symbol('start')
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
const NULL_OPERATION_TYPE = 0
const PLAYBACK_COMPLETE_TYPE = 1
const MINUTE_COUNT_DOWN_OPERATION_TYPE = 2
const USER_INTERRUPT = 3

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

class MinuteCountDownEvent extends Operation {
  constructor(timeRemaining) {
    super(MINUTE_COUNT_DOWN_OPERATION_TYPE)
    this.timeRemaining = timeRemaining
  }
}

// in milliseconds
const ONE_MINUTE = 60000

class AudioStateMachine {
  constructor() {
    this.duration = 0
    this.shicoGroup = null
    this.phraseGroups = []
    this.countdownCallback = stub
    this.state = INIT_STATE

    // Currently playing players. Once a playback finishes, it is removed from
    // the list.
    // TODO: Accept multiple players. It would have to keep track of where
    // the player came from (i.e. which group), in order to be able to figure
    // out which group to play from next.
    this.currentPlayer = null
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

    // This should start the timer regardless of whether any audio groups have
    // been registered. They can be added/changed/removed later.
    this.state = START_STATE
    this.currentPlayer = this.phraseGroups[0].start()
    this.currentPlayer.onplayended = this.completedPhrasePlayback.bind(this)
    this.currentPlayer.play()

    // No need to call processNext(). The event handlers will do it.
  }

  playFast() {
    this.state = START_FAST_STATE
    this.currentPlayer = this.phraseGroups[0].startFast()
    this.currentPlayer.onplayended = this.completedPhrasePlayback.bind(this)
    this.currentPlayer.play()
  }

  abrupt() {
    if (this.currentPlayer) {
      this.currentPlayer.stop()
    }

    this.state = ABRUPT_STATE
    this.currentPlayer = this.phraseGroups[0].abrupt()
    this.currentPlayer.onplayended = this.completedPhrasePlayback.bind(this)
    this.currentPlayer.play()
  }

  giveUp() {
    if (this.currentPlayer) {
      this.currentPlayer.stop()
    }
    this.state = GIVE_UP_STATE
    this.currentPlayer = this.phraseGroups[0].giveup()
    this.currentPlayer.onplayended = this.completedPhrasePlayback.bind(this)
    this.currentPlayer.play()
  }

  end() {
    // TODO: Check if it is in an allowed state. There may be states that this
    // is considered a NOP, i.e not allowed operation.
    if (this.currentPlayer) {
      this.currentPlayer.stop()
    }

    if (
      this.state == NORMAL_STATE ||
      this.state == WAITING_NORMAL_END_STATE ||
      this.state == START_STATE
    ) {
      this.giveUp()
      return
    } else if (this.state == FAST_STATE) {
      this.state = END_STATE

      this.currentPlayer = this.phraseGroups[0].end()
      this.currentPlayer.onplayended = this.completedPhrasePlayback.bind(this)
      this.currentPlayer.play()
    }
  }

  stop() {
    if (this.currentPlayer) {
      this.currentPlayer.stop()
    }
    console.log('stop')
    this.currentPlayer = null
    this.state = INIT_STATE
  }

  // Non-public functions.

  completedPhrasePlayback(player) {
    this.processNext(new PlaybackComplete(player))
  }

  startHandler(event) {
    this.currentPlayer = null
    this.state = NORMAL_STATE
    if (this.duration > 0) {
      setTimeout(this.timerFired.bind(this), ONE_MINUTE)
    }
    this.processNext(new Operation(NULL_OPERATION_TYPE))
  }

  startFastHandler(event) {
    this.currentPlayer = null
    this.state = FAST_STATE
    this.processNext(new Operation(NULL_OPERATION_TYPE))
  }

  normalHandler(event) {
    if (
      event.type == NULL_OPERATION_TYPE ||
      event.type == PLAYBACK_COMPLETE_TYPE
    ) {
      this.currentPlayer = this.phraseGroups[0].phrase()
      this.currentPlayer.onplayended = this.completedPhrasePlayback.bind(this)
      this.currentPlayer.play()
    } else if (event.type == MINUTE_COUNT_DOWN_OPERATION_TYPE) {
      if (event.timeRemaining > 0) {
        const notificationPlayer = this.phraseGroups[0].perMinuteNotification(
          event.timeRemaining
        )
        notificationPlayer.play()
        // No need to setup a onplayended callback. There is no action to take
        // after this finishes playing, nor is it required to stop it forcefully.
        return
      }
      // Note that the player might still be playing, which is fine.
      // Let it finish and transition to the next state.
      // There should not be any "race condition" even if this handler
      // is running as a separate macrotask from the event handler.
      this.state = WAITING_NORMAL_END_STATE
    }
  }

  waitingNormalEndState(event) {
    if (event.type != PLAYBACK_COMPLETE_TYPE) {
      return
    }

    this.state = LAST_MINUTE_STATE
    this.currentPlayer = this.phraseGroups[0].lastMinute()
    this.currentPlayer.onplayended = this.completedPhrasePlayback.bind(this)
    this.currentPlayer.play()
  }

  lastMinuteHandler(event) {
    if (event.type != PLAYBACK_COMPLETE_TYPE) {
      return
    }
    this.state = FAST_STATE
    this.processNext(new Operation(NULL_OPERATION_TYPE))
  }

  abruptHandler(event) {
    assert(event.type == PLAYBACK_COMPLETE_TYPE)
    this.state = TERMINAL_STATE
  }

  giveUpHandler(event) {
    // Note that a timer could fire in this tate.
    if (event.type == PLAYBACK_COMPLETE_TYPE) {
      this.state = FAST_STATE
      this.processNext(new Operation(NULL_OPERATION_TYPE))
    }
  }

  fastHandler(event) {
    // Note that the event doesn't matter. Once in fast mode it stays in
    // fast until the user initiates an action.
    this.currentPlayer = this.phraseGroups[0].fast()

    this.currentPlayer.onplayended = this.completedPhrasePlayback.bind(this)
    this.currentPlayer.play()
  }

  endHandler(event) {
    this.state = TERMINAL_STATE
    this.currentPlayer = null
  }

  processNext(event) {
    if (this.state == START_STATE) {
      this.startHandler(event)
    } else if (this.state == START_FAST_STATE) {
      this.startFastHandler(event)
    } else if (this.state == NORMAL_STATE) {
      this.normalHandler(event)
    } else if (this.state == WAITING_NORMAL_END_STATE) {
      this.waitingNormalEndState(event)
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
  AudioStateMachine
}
