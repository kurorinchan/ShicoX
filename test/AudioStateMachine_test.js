var asm = require('../src/components/AudioStateMachine')
const sinon = require('sinon')

class Group {
  start() {}
}

const AudioStateMachine = asm.AudioStateMachine

var chai = require('chai'),
  should = chai.should(),
  expect = chai.expect

class FakePlayer {
  set onplayended(cb) {
    this.setOnEnded(cb)
  }

  setOnEnded(cb) {
    this.cb = cb
  }

  play() {
    console.log('play')
  }

  prepare() {}

  fireCallback() {
    this.cb()
  }
}

class FakeGroup {
  perMinuteNotification(timeRemaining) {}

  start() {}
  fast() {}
  phrase() {}
  lastMinute() {}
}

describe('AudioStatemachine', function() {
  let clock = null
  beforeEach(function() {
    clock = sinon.useFakeTimers()
  })

  afterEach(function() {
    clock.restore()
  })

  it('add phrase groups', function() {
    const machine = new AudioStateMachine()
    machine.addPhraseGroup({})
  })

  it('play', function() {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer()
    const phraseGroupMock = sinon.mock(fakeGroup)
    const onendedSpy = sinon.spy(fakePlayer, 'onplayended', ['set'])
    const playSpy = sinon.spy(fakePlayer, 'play')
    phraseGroupMock
      .expects('start')
      .once()
      .returns(fakePlayer)
    machine.addPhraseGroup(fakeGroup)
    machine.play(1)
    expect(onendedSpy.set.calledOnce).to.be.true
    expect(playSpy.calledOnce).to.be.true
  })

  // This "starts" and the play back finishes, and expects the "phrase" to be
  // played next.
  it('start play and then transition to normal state', function() {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer()
    const phraseGroupMock = sinon.mock(fakeGroup)
    const onendedSpy = sinon.spy(fakePlayer, 'onplayended', ['set'])
    const playSpy = sinon.spy(fakePlayer, 'play')
    phraseGroupMock
      .expects('start')
      .once()
      .returns(fakePlayer)
    machine.addPhraseGroup(fakeGroup)
    machine.play(1)
    expect(onendedSpy.set.calledOnce).to.be.true
    expect(playSpy.calledOnce).to.be.true

    phraseGroupMock
      .expects('phrase')
      .once()
      .returns(fakePlayer)

    fakePlayer.fireCallback()
    expect(onendedSpy.set.calledTwice).to.be.true
    expect(playSpy.calledTwice).to.be.true
  })

  // This shouldn't transition states. The timer should start/fire after the
  // playback ends.
  it('start play and before playback finishes 60 seconds go by', function() {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer()
    const phraseGroupMock = sinon.mock(fakeGroup)
    const onendedSpy = sinon.spy(fakePlayer, 'onplayended', ['set'])
    const playSpy = sinon.spy(fakePlayer, 'play')
    phraseGroupMock
      .expects('start')
      .once()
      .returns(fakePlayer)
    machine.addPhraseGroup(fakeGroup)
    machine.play(1)
    expect(onendedSpy.set.calledOnce).to.be.true
    expect(playSpy.calledOnce).to.be.true

    clock.tick(60000)
  })

  // The playback starts with 2 minutes. When the timer goes off after a minute,
  // it should playback a countdown voice.
  it('start play finishes and timer fires while playing normal phrases', function() {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer()
    const phraseGroupMock = sinon.mock(fakeGroup)
    const onendedSpy = sinon.spy(fakePlayer, 'onplayended', ['set'])
    const playSpy = sinon.spy(fakePlayer, 'play')
    phraseGroupMock
      .expects('start')
      .once()
      .returns(fakePlayer)

    // Expect 'phrase' to be called twice because the phrase finish callback
    // is fired below.
    phraseGroupMock
      .expects('phrase')
      .twice()
      .returns(fakePlayer)

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

  it('start play and before playback finishes 60 seconds go by', function() {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer()
    const phraseGroupMock = sinon.mock(fakeGroup)
    const onendedSpy = sinon.spy(fakePlayer, 'onplayended', ['set'])
    const playSpy = sinon.spy(fakePlayer, 'play')
    phraseGroupMock
      .expects('start')
      .once()
      .returns(fakePlayer)
    machine.addPhraseGroup(fakeGroup)
    machine.play(1)
    expect(onendedSpy.set.calledOnce).to.be.true
    expect(playSpy.calledOnce).to.be.true

    clock.tick(60000)
  })

  // The playback starts with 2 minutes. When the timer goes off after a minute,
  // it should playback a countdown voice.
  // Then it continues till last minute state.
  it('play till last minute state', function() {
    const machine = new AudioStateMachine()
    const fakeGroup = new FakeGroup()
    const fakePlayer = new FakePlayer()
    const phraseGroupMock = sinon.mock(fakeGroup)
    phraseGroupMock
      .expects('start')
      .once()
      .returns(fakePlayer)
    phraseGroupMock
      .expects('phrase')
      .twice()
      .returns(fakePlayer)
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
    phraseGroupMock
      .expects('lastMinute')
      .once()
      .returns(fakePlayer)

    // Playback end for the second 'phrase'.
    fakePlayer.fireCallback()
    phraseGroupMock.verify()
  })
})
