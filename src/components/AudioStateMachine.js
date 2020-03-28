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

function stub() { }

// This is an event type that isn't really associated with anything.
// Use this event for passing "no info" to a state handler, e.g. transition
// to a next state that doesn't require any info from the previous.
const NULL_EVENT_TYPE = 0
const PLAYBACK_COMPLETE_EVENT_TYPE = 1
const MINUTE_COUNT_DOWN_EVENT_TYPE = 2
const USER_INTERRUPT = 3

class Event {
  constructor(type) {
    this.type = type
  }

  get type() {
    return this.type
  }
}

class PlaybackCompleteEvent extends Event {
  constructor(player) {
    super(PLAYBACK_COMPLETE_EVENT_TYPE)
    this.player = player
  }

  get player() {
    return this.player
  }
}

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

  removePhraseGroup(group) {
  }

  // Notifies the callback the time remaining in minutes in "normal" mode.
  set oncountdown(callback) {
    this.countdownCallback = callback
  }

  // Starts the playback. Pass in the duration in minutes of how long it should
  // stay in the "normal" mode.
  play(duration_in_minutes) {
    if (duration_in_minutes == 0) {
      this.state = FAST_STATE
      return
    }

    // This should start the timer regardless of whether any audio groups have
    // been registered. They can be added/changed/removed later.
    this.state = START_STATE
    for (const group of this.phraseGroups) {
      this.currentPlayer = group.start()
    }

    this.currentPlayer.onended = this.completedPhrasePlayback
    this.currentPlayer.play()

    // No need to call processNext(). The event handlers will do it.
  }

  playFast() {
  }

  giveUp() {

  }


  end() {
    // TODO: Check if it is in an allowed state.

    if (this.currentPlayer) {
      this.currentPlayer.pause()
    }
    this.state = END_STATE

    for (const group of this.phraseGroups) {
      this.currentPlayer = group.end()
    }

    this.currentPlayer = this.completedPhrasePlayback
    this.currentPlayer.play()
  }

  stop() {
  }

  // Non-public functions.

  completedPhrasePlayback(player) {
    this.processNext(new PlaybackCompleteEvent(player))
  }

  startHandler(event) {
    this.currentPlayer = null
    this.state = FAST_STATE
    processNext(new Event(NULL_EVENT_TYPE))
  }

  fastHandler(event) {
    // Note that the event doesn't matter. Once in fast mode it stays in
    // fast until 
    for (const group of this.phraseGroups) {
      this.currentPlayer = group.fast()
    }

    this.currentPlayer = this.completedPhrasePlayback
    this.currentPlayer.play()
  }

  endHandler(event) {
    this.state = TERMINAL_STATE
  }

  processNext(event) {
    if (this.state == START_STATE) {
      this.startHandler(event)
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
