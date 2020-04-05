const asm = require('../src/components/AudioStateMachine')
const sinon = require('sinon')

const AudioStateMachine = asm.AudioStateMachine

var chai = require('chai'),
  expect = chai.expect

class FakePlayer {
  // Optionally give it a name for debugging.
  constructor(name = '') {
    this.name = name
  }

  set onplayended(cb) {
    this.setOnEnded(cb)
  }

  setOnEnded(cb) {
    this.cb = cb
  }

  play() {}

  stop() {}

  prepare() {}

  fireCallback() {
    this.cb(this)
  }

  get assetGroupNumber() {
    return 1
  }
}

class FakeGroup {
  perMinuteNotification(timeRemaining) {}

  start() {}
  startFast() {}
  fast() {}
  phrase() {}
  lastMinute() {}
  abrupt() {}
  giveup() {}
  end() {}

  assetGroupNumber() {
    return 1
  }
}

describe('AudioStatemachine', function () {
  let clock = null
  beforeEach(function () {
    clock = sinon.useFakeTimers()
  })

  afterEach(function () {
    clock.restore()
  })

  it('add phrase groups', function () {
    const machine = new AudioStateMachine()
    machine.addPhraseGroup({})
  })

  it('play', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer()
    const phraseGroupMock = sinon.mock(fakeGroup)
    const onendedSpy = sinon.spy(fakePlayer, 'onplayended', ['set'])
    const playSpy = sinon.spy(fakePlayer, 'play')
    phraseGroupMock.expects('start').once().returns(fakePlayer)
    machine.addPhraseGroup(fakeGroup)
    machine.play(1)
    expect(onendedSpy.set.calledOnce).to.be.true
    expect(playSpy.calledOnce).to.be.true
  })

  // This "starts" and the play back finishes, and expects the "phrase" to be
  // played next.
  it('start play and then transition to normal state', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer()
    const phraseGroupMock = sinon.mock(fakeGroup)
    const onendedSpy = sinon.spy(fakePlayer, 'onplayended', ['set'])
    const playSpy = sinon.spy(fakePlayer, 'play')
    phraseGroupMock.expects('start').once().returns(fakePlayer)
    machine.addPhraseGroup(fakeGroup)
    machine.play(1)
    expect(onendedSpy.set.calledOnce).to.be.true
    expect(playSpy.calledOnce).to.be.true

    phraseGroupMock.expects('phrase').once().returns(fakePlayer)

    fakePlayer.fireCallback()
    expect(onendedSpy.set.calledTwice).to.be.true
    expect(playSpy.calledTwice).to.be.true
  })

  // This shouldn't transition states. The timer should start/fire after the
  // playback ends.
  it('start play and before playback finishes 60 seconds go by', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer()
    const phraseGroupMock = sinon.mock(fakeGroup)
    const onendedSpy = sinon.spy(fakePlayer, 'onplayended', ['set'])
    const playSpy = sinon.spy(fakePlayer, 'play')
    phraseGroupMock.expects('start').once().returns(fakePlayer)
    machine.addPhraseGroup(fakeGroup)
    machine.play(1)
    expect(onendedSpy.set.calledOnce).to.be.true
    expect(playSpy.calledOnce).to.be.true

    clock.tick(60000)
    phraseGroupMock.verify()
  })

  // The playback starts with 2 minutes. When the timer goes off after a minute,
  // it should playback a countdown voice.
  it('start play finishes and timer fires while playing normal phrases', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer()
    const phraseGroupMock = sinon.mock(fakeGroup)
    const onendedSpy = sinon.spy(fakePlayer, 'onplayended', ['set'])
    const playSpy = sinon.spy(fakePlayer, 'play')
    phraseGroupMock.expects('start').once().returns(fakePlayer)

    // Expect 'phrase' to be called twice because the phrase finish callback
    // is fired below.
    phraseGroupMock.expects('phrase').twice().returns(fakePlayer)

    machine.addPhraseGroup(fakeGroup)
    machine.play(2)

    // Playback end for 'start'.
    fakePlayer.fireCallback()

    const perMinuteNotificationPlayer = new FakePlayer()
    phraseGroupMock
      .expects('perMinuteNotification')
      .withArgs(1)
      .atLeast(1)
      .returns(perMinuteNotificationPlayer)

    // Should palyback a countdown voice.
    clock.tick(60000)

    // Playback end for 'pharse'
    fakePlayer.fireCallback()

    expect(onendedSpy.set.calledThrice).to.be.true
    expect(playSpy.calledThrice).to.be.true

    phraseGroupMock.verify()
  })

  it('start play and before playback finishes 60 seconds go by', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer()
    const phraseGroupMock = sinon.mock(fakeGroup)
    const onendedSpy = sinon.spy(fakePlayer, 'onplayended', ['set'])
    const playSpy = sinon.spy(fakePlayer, 'play')
    phraseGroupMock.expects('start').once().returns(fakePlayer)
    machine.addPhraseGroup(fakeGroup)
    machine.play(1)
    expect(onendedSpy.set.calledOnce).to.be.true
    expect(playSpy.calledOnce).to.be.true

    clock.tick(60000)
    phraseGroupMock.verify()
  })

  // The playback starts with 2 minutes. When the timer goes off after a minute,
  // it should playback a countdown voice.
  // Then it continues till last minute state.
  it('play till last minute state', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer()
    const phraseGroupMock = sinon.mock(fakeGroup)
    phraseGroupMock.expects('start').once().returns(fakePlayer)
    phraseGroupMock.expects('phrase').twice().returns(fakePlayer)
    phraseGroupMock
      .expects('perMinuteNotification')
      .withArgs(1)
      .once()
      .returns(new FakePlayer())

    machine.addPhraseGroup(fakeGroup)
    machine.play(2)

    // Playback end for 'start'.
    fakePlayer.fireCallback()

    // Should play a countdown voice.
    clock.tick(60000)

    // Playback end for 'pharse'.
    fakePlayer.fireCallback()

    // Should set the state to WAITING_FOR_END_STATE
    clock.tick(60000)

    // Once the second 'phrase' completes, it should now play 'lastMinute'.
    phraseGroupMock.expects('lastMinute').once().returns(fakePlayer)

    // Playback end for the second 'phrase'.
    fakePlayer.fireCallback()
    phraseGroupMock.verify()
  })

  // Play starts normally then go all the way to fast.
  it('play till fast', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer()
    const phraseGroupMock = sinon.mock(fakeGroup)
    phraseGroupMock.expects('start').once().returns(fakePlayer)
    phraseGroupMock.expects('phrase').twice().returns(fakePlayer)
    phraseGroupMock
      .expects('perMinuteNotification')
      .withArgs(1)
      .once()
      .returns(new FakePlayer())
    phraseGroupMock.expects('lastMinute').once().returns(fakePlayer)

    machine.addPhraseGroup(fakeGroup)
    machine.play(2)

    // Playback end for 'start'.
    fakePlayer.fireCallback()

    // Should play a countdown voice.
    clock.tick(60000)

    // Playback end for 'pharse'.
    fakePlayer.fireCallback()

    // Should set the state to WAITING_FOR_END_STATE
    clock.tick(60000)

    // Playback end for the second 'phrase'.
    fakePlayer.fireCallback()

    phraseGroupMock.expects('fast').once().returns(fakePlayer)

    // Playback end for 'lastminute'
    fakePlayer.fireCallback()

    phraseGroupMock.verify()
  })

  // This is a complete sequence of states from start to finish.
  it('play till end', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer()
    const fakePlayerMock = sinon.mock(fakePlayer)
    const phraseGroupMock = sinon.mock(fakeGroup)
    phraseGroupMock.expects('start').once().returns(fakePlayer)
    phraseGroupMock.expects('phrase').twice().returns(fakePlayer)
    phraseGroupMock
      .expects('perMinuteNotification')
      .withArgs(1)
      .once()
      .returns(new FakePlayer())
    phraseGroupMock.expects('lastMinute').once().returns(fakePlayer)
    phraseGroupMock.expects('fast').once().returns(fakePlayer)

    machine.addPhraseGroup(fakeGroup)
    machine.play(2)

    // Playback end for 'start'.
    fakePlayer.fireCallback()

    // Should play a countdown voice.
    clock.tick(60000)

    // Playback end for 'pharse'.
    fakePlayer.fireCallback()

    // Should set the state to WAITING_FOR_END_STATE
    clock.tick(60000)

    // Playback end for the second 'phrase'.
    fakePlayer.fireCallback()

    // Playback end for 'lastminute'
    fakePlayer.fireCallback()

    fakePlayerMock.expects('stop').once()
    phraseGroupMock.expects('end').once().returns(fakePlayer)

    // The machine is forced into END_STATE. No playback end callback for 'fast'.
    machine.end()

    // 'end' finishes.
    fakePlayer.fireCallback()

    fakePlayerMock.verify()
    phraseGroupMock.verify()
  })

  // Play normal phrase a few times.
  it('loop normal phrase', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer()
    const phraseGroupMock = sinon.mock(fakeGroup)
    phraseGroupMock.expects('start').once().returns(fakePlayer)
    phraseGroupMock.expects('phrase').atLeast(2).returns(fakePlayer)

    machine.addPhraseGroup(fakeGroup)
    machine.play(1)

    // Playback end for 'start'.
    fakePlayer.fireCallback()

    // Playback end for 'pharse'. A few times. Shouldn't cause any problems.
    fakePlayer.fireCallback()
    fakePlayer.fireCallback()
    fakePlayer.fireCallback()
    fakePlayer.fireCallback()
  })

  // Play normal phrase a few times. The timer goes off once in a while but
  // the test will not reach the end of the countdown
  it('loop normal phrase with timer', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer()
    const phraseGroupMock = sinon.mock(fakeGroup)
    phraseGroupMock.expects('start').once().returns(fakePlayer)
    phraseGroupMock.expects('phrase').atLeast(2).returns(fakePlayer)
    phraseGroupMock
      .expects('perMinuteNotification')
      .atLeast(1)
      .returns(new FakePlayer())

    machine.addPhraseGroup(fakeGroup)
    machine.play(100)

    // Playback end for 'start'.
    fakePlayer.fireCallback()

    // Playback 'phrase' a few times.
    fakePlayer.fireCallback()
    fakePlayer.fireCallback()
    fakePlayer.fireCallback()

    // A countdown goes off.
    clock.tick(60000)

    fakePlayer.fireCallback()
    fakePlayer.fireCallback()
    fakePlayer.fireCallback()
    fakePlayer.fireCallback()

    // Two countdowns go off while a long 'phrase' plays.
    clock.tick(60000)
    clock.tick(60000)

    fakePlayer.fireCallback()
    fakePlayer.fireCallback()
    phraseGroupMock.verify()
  })

  it('force end in normal state', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer('generic')
    const fakePlayerMock = sinon.mock(fakePlayer)
    const phraseGroupMock = sinon.mock(fakeGroup)
    phraseGroupMock.expects('start').once().returns(fakePlayer)
    phraseGroupMock.expects('phrase').atLeast(1).returns(fakePlayer)

    machine.addPhraseGroup(fakeGroup)
    machine.play(100)

    // Playback 'phrase' a few times.
    fakePlayer.fireCallback()
    fakePlayer.fireCallback()
    fakePlayer.fireCallback()

    // TODO: Decide whether this should be exact. This may require adding more
    // methods on Player or assign null to player field in state machine.
    fakePlayerMock.expects('stop').atLeast(1)
    phraseGroupMock.expects('abrupt').once().returns(fakePlayer)

    machine.end()
    fakePlayerMock.verify()
    phraseGroupMock.verify()
  })

  it('timer fires when abrupt playing', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer('generic')
    const fakePlayerMock = sinon.mock(fakePlayer)
    const phraseGroupMock = sinon.mock(fakeGroup)
    phraseGroupMock.expects('start').once().returns(fakePlayer)
    phraseGroupMock.expects('phrase').atLeast(1).returns(fakePlayer)

    machine.addPhraseGroup(fakeGroup)
    machine.play(100)

    // Playback 'phrase' a few times.
    fakePlayer.fireCallback()
    fakePlayer.fireCallback()
    fakePlayer.fireCallback()

    // TODO: Decide whether this should be exact. This may require adding more
    // methods on Player or assign null to player field in state machine.
    fakePlayerMock.expects('stop').atLeast(1)
    phraseGroupMock.expects('abrupt').once().returns(fakePlayer)

    machine.end()

    clock.tick(60000)
    fakePlayerMock.verify()
    phraseGroupMock.verify()
  })

  it('force end in waiting-for-normal state', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer('generic')
    const fakePlayerMock = sinon.mock(fakePlayer)
    const phraseGroupMock = sinon.mock(fakeGroup)
    phraseGroupMock.expects('start').once().returns(fakePlayer)
    phraseGroupMock.expects('phrase').atLeast(1).returns(fakePlayer)

    machine.addPhraseGroup(fakeGroup)
    machine.play(1)

    // 'start' end. 'phrase' plays.
    fakePlayer.fireCallback()

    // A minute goes by. 'phrase is still playing.
    clock.tick(60000)

    // TODO: Decide whether this should be exact. This may require adding more
    // methods on Player or assign null to player field in state machine.
    fakePlayerMock.expects('stop').atLeast(1)
    phraseGroupMock.expects('abrupt').once().returns(fakePlayer)

    machine.end()
    fakePlayerMock.verify()
    phraseGroupMock.verify()
  })

  // An edge case where end() is forced while 'lastMinute' is playing.
  // It should be a NOP, and transition normally to 'fast'.
  it('force end right after countdown ends', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer('generic')
    const phraseGroupMock = sinon.mock(fakeGroup)
    phraseGroupMock.expects('start').once().returns(fakePlayer)
    phraseGroupMock.expects('phrase').atLeast(1).returns(fakePlayer)

    const lastMinutePlayer = new FakePlayer('last-minute')
    const lastMinutePlayerMock = sinon.mock(lastMinutePlayer)

    // The player should not be stopped by end().
    lastMinutePlayerMock.expects('stop').never()

    phraseGroupMock.expects('lastMinute').once().returns(lastMinutePlayer)

    phraseGroupMock.expects('fast').once().returns(fakePlayer)

    machine.addPhraseGroup(fakeGroup)
    machine.play(1)

    // Playback end for 'start'. 'pharse' starts playing.
    fakePlayer.fireCallback()

    // Playback end for 'pharse'. Next 'phrase' starts playing.
    fakePlayer.fireCallback()

    // Should set the state to WAITING_FOR_END_STATE
    clock.tick(60000)

    // Playback end for 'pharse'. Next 'lastMinute' starts playing.
    fakePlayer.fireCallback()

    // This is a NOP. The state proceeds to FAST.
    machine.end()

    // 'lastMinute' finishes.
    lastMinutePlayer.fireCallback()

    lastMinutePlayerMock.verify()
    phraseGroupMock.verify()
  })

  // An edge case where giveUp() is forced while 'lastMinute' is playing.
  // It should be a NOP, and transition normally to 'fast'.
  it('force giveup right after count down ends', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer('generic')
    const phraseGroupMock = sinon.mock(fakeGroup)
    phraseGroupMock.expects('start').once().returns(fakePlayer)
    phraseGroupMock.expects('phrase').atLeast(1).returns(fakePlayer)

    const lastMinutePlayer = new FakePlayer('last-minute')
    const lastMinutePlayerMock = sinon.mock(lastMinutePlayer)

    // The player should not be stopped by end().
    lastMinutePlayerMock.expects('stop').never()

    phraseGroupMock.expects('lastMinute').once().returns(lastMinutePlayer)

    phraseGroupMock.expects('fast').once().returns(fakePlayer)

    machine.addPhraseGroup(fakeGroup)
    machine.play(1)

    // Playback end for 'start'. 'pharse' starts playing.
    fakePlayer.fireCallback()

    // Playback end for 'pharse'. Next 'phrase' starts playing.
    fakePlayer.fireCallback()

    // Should set the state to WAITING_FOR_END_STATE
    clock.tick(60000)

    // Playback end for 'pharse'. Next 'lastMinute' starts playing.
    fakePlayer.fireCallback()

    // This is a NOP. The state proceeds to FAST.
    machine.giveUp()

    // 'lastMinute' finishes.
    lastMinutePlayer.fireCallback()

    lastMinutePlayerMock.verify()
    phraseGroupMock.verify()
  })

  it('force giveup in normal state', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer('generic')
    const fakePlayerMock = sinon.mock(fakePlayer)
    const phraseGroupMock = sinon.mock(fakeGroup)
    phraseGroupMock.expects('start').once().returns(fakePlayer)
    phraseGroupMock.expects('phrase').atLeast(1).returns(fakePlayer)

    machine.addPhraseGroup(fakeGroup)
    machine.play(100)

    // Playback 'phrase' a few times.
    fakePlayer.fireCallback()
    fakePlayer.fireCallback()
    fakePlayer.fireCallback()

    fakePlayerMock.expects('stop').atLeast(1)
    phraseGroupMock.expects('giveup').once().returns(fakePlayer)

    machine.giveUp()

    // Right after giveup whould be fast.
    phraseGroupMock.expects('fast').once().returns(fakePlayer)

    // Playback end for 'giveup'.
    fakePlayer.fireCallback()

    fakePlayerMock.verify()
    phraseGroupMock.verify()
  })

  // The timer event should not cause any problems. It should just be ignored.
  it('timer fires when giveup is playing', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer('generic')
    const fakePlayerMock = sinon.mock(fakePlayer)
    const phraseGroupMock = sinon.mock(fakeGroup)
    phraseGroupMock.expects('start').once().returns(fakePlayer)
    phraseGroupMock.expects('phrase').atLeast(1).returns(fakePlayer)

    machine.addPhraseGroup(fakeGroup)
    machine.play(100)

    // Playback 'phrase' a few times.
    fakePlayer.fireCallback()
    fakePlayer.fireCallback()
    fakePlayer.fireCallback()

    fakePlayerMock.expects('stop').atLeast(1)
    phraseGroupMock.expects('giveup').once().returns(fakePlayer)

    machine.giveUp()

    // Right after giveup whould be fast.
    phraseGroupMock.expects('fast').once().returns(fakePlayer)

    clock.tick(60000)

    // Playback end for 'giveup'.
    fakePlayer.fireCallback()

    fakePlayerMock.verify()
    phraseGroupMock.verify()
  })

  // start fast and stay in FAST state.
  it('start fast', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer('generic')
    const phraseGroupMock = sinon.mock(fakeGroup)
    phraseGroupMock.expects('startFast').once().returns(fakePlayer)

    machine.addPhraseGroup(fakeGroup)
    machine.playFast()

    phraseGroupMock.expects('fast').atLeast(1).returns(fakePlayer)

    // 'startFast' ends. Plays 'fast'.
    fakePlayer.fireCallback()
    // 'fast' ends. Plays the next 'fast'. Repeat a few times.
    fakePlayer.fireCallback()
    fakePlayer.fireCallback()
    fakePlayer.fireCallback()

    phraseGroupMock.verify()
  })

  it('start fast and play till end', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer('generic')
    const phraseGroupMock = sinon.mock(fakeGroup)
    phraseGroupMock.expects('startFast').once().returns(fakePlayer)
    phraseGroupMock.expects('fast').atLeast(1).returns(fakePlayer)

    machine.addPhraseGroup(fakeGroup)
    machine.playFast()

    // 'startFast' ends. Plays 'fast'.
    fakePlayer.fireCallback()
    // 'fast' ends. Plays the next 'fast'.
    fakePlayer.fireCallback()

    phraseGroupMock.expects('end').once().returns(fakePlayer)

    machine.end()

    // 'end' finishes.
    fakePlayer.fireCallback()

    phraseGroupMock.verify()
  })

  // TODO: Add tests for invalid transitions initiated by users.
})
