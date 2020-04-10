const asm = require('../src/components/AudioStateMachine')
const sinon = require('sinon')

const AudioStateMachine = asm.AudioStateMachine

var chai = require('chai'),
  expect = chai.expect

class FakePlayer {
  // Optionally give it a name for debugging.
  constructor(name = '') {
    this.name = name
    this.groupNumber = 1
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
    return this.groupNumber
  }

  set assetGroupNumber(v) {
    this.groupNumber = v
  }
}

class FakeGroup {
  constructor() {
    this.assetGroup = 1
  }

  perMinuteNotification() {}

  shico() {}
  shicoFast() {}

  start() {}
  startFast() {}
  fast() {}
  phrase() {}
  lastMinute() {}
  abrupt() {}
  giveup() {}
  end() {}

  setAssetGroupNumber(v) {
    this.assetGroup = v
  }

  assetGroupNumber() {
    return this.assetGroup
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

  describe('Single phrase group only', function () {
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
  })

  describe('Single phrase with shico', function () {
    it('start fast and stay in fast', function () {
      const machine = new AudioStateMachine()
      const fakeGroup = new FakeGroup()
      const fakePharsePlayer = new FakePlayer('generic')
      const fakeShicoPlayer = new FakePlayer('shico')
      const phraseGroupMock = sinon.mock(fakeGroup)
      phraseGroupMock.expects('startFast').once().returns(fakePharsePlayer)
      phraseGroupMock.expects('fast').exactly(3).returns(fakePharsePlayer)

      machine.setShicoGroup(fakeGroup)
      machine.addPhraseGroup(fakeGroup)
      machine.playFast()

      phraseGroupMock.expects('shicoFast').exactly(4).returns(fakeShicoPlayer)

      // 'startFast' ends. Plays 'fast'.
      fakePharsePlayer.fireCallback()
      // 'fast' ends. Plays the next 'fast'.
      fakePharsePlayer.fireCallback()

      // Let 'shico' end a few times.
      fakeShicoPlayer.fireCallback()
      fakeShicoPlayer.fireCallback()
      fakeShicoPlayer.fireCallback()

      fakePharsePlayer.fireCallback()

      phraseGroupMock.verify()
    })
  })

  describe('Multiple phrase', function () {
    beforeEach(function () {
      const machine = new AudioStateMachine()
      const group1 = new FakeGroup()
      group1.setAssetGroupNumber(1)
      const group2 = new FakeGroup()
      group2.setAssetGroupNumber(2)
      const player1 = new FakePlayer()
      player1.assetGroupNumber = 1
      const player2 = new FakePlayer()
      player2.assetGroupNumber = 2
      const groupMock1 = sinon.mock(group1)
      const groupMock2 = sinon.mock(group2)

      this.machine = machine
      this.group1 = group1
      this.group2 = group2
      this.player1 = player1
      this.player2 = player2
      this.groupMock1 = groupMock1
      this.groupMock2 = groupMock2
    })

    it('start fast and stay in fast', function () {
      this.groupMock1.expects('startFast').once().returns(this.player1)
      this.groupMock1.expects('fast').atLeast(3).returns(this.player1)
      this.groupMock2.expects('startFast').once().returns(this.player2)
      this.groupMock2.expects('fast').atLeast(3).returns(this.player2)

      this.machine.addPhraseGroup(this.group1)
      this.machine.addPhraseGroup(this.group2)
      this.machine.playFast()

      // 'startFast' ends, for the first group.
      this.player1.fireCallback()

      // 'startFast' ends, for the second group.
      this.player2.fireCallback()

      // Let 'fast' end a few times for the first group.
      this.player1.fireCallback()
      this.player1.fireCallback()
      this.player1.fireCallback()

      // 'fast' finally ends once for the second group.
      this.player2.fireCallback()

      // A random mix of events.
      this.player1.fireCallback()
      this.player1.fireCallback()
      this.player2.fireCallback()
      this.player2.fireCallback()
      this.player2.fireCallback()
      this.player1.fireCallback()
      this.player2.fireCallback()
      this.player1.fireCallback()
      this.player2.fireCallback()

      this.groupMock1.verify()
      this.groupMock2.verify()
    })

    it('remove a group', function () {
      this.groupMock1.expects('startFast').once().returns(this.player1)
      this.groupMock2.expects('startFast').once().returns(this.player2)

      const playerMock = sinon.mock(this.player1)

      this.machine.addPhraseGroup(this.group1)
      this.machine.addPhraseGroup(this.group2)
      this.machine.playFast()

      // Expect the removal to stop the player immediately.
      playerMock.expects('stop').once()

      this.machine.removePhraseGroup(this.group1)
      this.groupMock1.verify()
      this.groupMock2.verify()
      playerMock.verify()
    })

    // When a phrase group is added back in NORMAL STATE, start playing it back
    // immediately.
    it('remove and then add it back in normal', function () {
      this.groupMock1.expects('start').once().returns(this.player1)
      this.groupMock2.expects('start').once().returns(this.player2)

      const playerMock = sinon.mock(this.player1)
      playerMock.expects('stop').once()

      this.machine.addPhraseGroup(this.group1)
      this.machine.addPhraseGroup(this.group2)
      this.machine.play(20)

      this.machine.removePhraseGroup(this.group1)

      this.groupMock2.expects('phrase').atLeast(1).returns(this.player2)

      // 'start' for the second group finished. Starts playing 'phrase'.
      this.player2.fireCallback()

      this.groupMock1.expects('phrase').atLeast(1).returns(this.player1)
      playerMock.expects('play').once()

      // Now add back group1 and make sure it starts playing 'pharse' as well.
      this.machine.addPhraseGroup(this.group1)
      this.groupMock1.verify()
      this.groupMock2.verify()
      playerMock.verify()
    })

    // This should not play 'start' again for the group that is added back.
    // Instead it should start playing with the other group from the next state,
    // i.e. from NORMAL state.
    it('remove and then add it back in start', function () {
      // Note that group1's "start" should only be called once. This expectation
      // covers the case where it shouldn't be called again when it's added
      // back.
      this.groupMock1.expects('start').once().returns(this.player1)
      this.groupMock2.expects('start').once().returns(this.player2)

      const playerMock = sinon.mock(this.player1)
      playerMock.expects('stop').once()

      this.machine.addPhraseGroup(this.group1)
      this.machine.addPhraseGroup(this.group2)
      this.machine.play(20)

      this.machine.removePhraseGroup(this.group1)
      this.machine.addPhraseGroup(this.group1)

      this.groupMock1.expects('phrase').once().returns(this.player1)
      this.groupMock2.expects('phrase').once().returns(this.player2)

      // 'start' for the second group finished. Starts playing 'phrase'.
      this.player2.fireCallback()

      // Now add back group1 and make sure it starts playing 'pharse' as well.
      this.groupMock1.verify()
      this.groupMock2.verify()
    })

    // When a phrase group is added back in FAST STATE, start playing it back
    // immediately.
    it('remove and then add it back in fast', function () {
      this.groupMock1.expects('startFast').once().returns(this.player1)
      this.groupMock2.expects('startFast').once().returns(this.player2)

      const playerMock = sinon.mock(this.player1)
      playerMock.expects('stop').once()

      this.machine.addPhraseGroup(this.group1)
      this.machine.addPhraseGroup(this.group2)
      this.machine.playFast()

      this.machine.removePhraseGroup(this.group1)

      this.groupMock2.expects('fast').atLeast(1).returns(this.player2)

      // 'startFast' for the second group finished. Starts playing 'fast'.
      this.player2.fireCallback()

      this.groupMock1.expects('fast').atLeast(1).returns(this.player1)
      playerMock.expects('play').once()

      // Now add back group1 and make sure it starts playing 'fast' as well.
      this.machine.addPhraseGroup(this.group1)
      this.groupMock1.verify()
      this.groupMock2.verify()
      playerMock.verify()
    })

    describe('with shico', function () {
      it('start fast stay in fast', function () {
        const fakeShicoPlayer = new FakePlayer('shico')

        this.groupMock1.expects('startFast').once().returns(this.player1)
        this.groupMock1.expects('fast').atLeast(3).returns(this.player1)
        this.groupMock2.expects('startFast').once().returns(this.player2)
        this.groupMock2.expects('fast').atLeast(3).returns(this.player2)

        this.machine.addPhraseGroup(this.group1)
        this.machine.addPhraseGroup(this.group2)
        this.machine.setShicoGroup(this.group1)

        this.machine.playFast()

        // 'startFast' ends, for the first group.
        this.player1.fireCallback()

        this.groupMock1.expects('shicoFast').atLeast(3).returns(fakeShicoPlayer)

        // 'startFast' ends, for the second group.
        this.player2.fireCallback()

        // Let 'fast' end a few times for the first group.
        this.player1.fireCallback()
        this.player1.fireCallback()
        fakeShicoPlayer.fireCallback()

        this.player1.fireCallback()

        // 'fast' finally ends once for the second group.
        this.player2.fireCallback()

        // A random mix of events.
        this.player1.fireCallback()
        this.player1.fireCallback()
        fakeShicoPlayer.fireCallback()
        fakeShicoPlayer.fireCallback()
        this.player2.fireCallback()
        this.player2.fireCallback()
        this.player2.fireCallback()
        fakeShicoPlayer.fireCallback()

        this.player1.fireCallback()
        this.player2.fireCallback()
        this.player1.fireCallback()
        fakeShicoPlayer.fireCallback()

        this.player2.fireCallback()

        this.groupMock1.verify()
        this.groupMock2.verify()
      })
    })
  })
})
// TODO: Add a case where a group is removed while playing 'end'.
// And make sure that it ends in a some terminating state.