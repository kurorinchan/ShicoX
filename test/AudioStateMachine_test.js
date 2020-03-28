var asm = require('../src/components/AudioStateMachine')
const sinon = require('sinon')

class Group {
  start() {

  }
}

const AudioStateMachine = asm.AudioStateMachine

var chai = require('chai')
  , should = chai.should()
  , expect = chai.expect;

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

  prepare() { }

  fireCallback() {
    this.cb()
  }
}

describe('AudioStatemachine', function () {
  it('add phrase groups', function () {
    const machine = new AudioStateMachine()
    machine.addPhraseGroup({})
  })

  it('start', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = {
      start: function () { },
      fast: function () { }
    }
    const fakePlayer = new FakePlayer()
    const phraseGroupMock = sinon.mock(fakeGroup)
    const onendedSpy = sinon.spy(fakePlayer, 'onplayended', ['set'])
    const playSpy = sinon.spy(fakePlayer, 'play')
    phraseGroupMock.expects('start').once().returns(fakePlayer)
    phraseGroupMock.expects('fast').once().returns(fakePlayer)

    machine.addPhraseGroup(fakeGroup)
    machine.play(1)

    expect(onendedSpy.set.calledOnce).to.be.true
    expect(playSpy.calledOnce).to.be.true
    fakePlayer.fireCallback()
  })
})
