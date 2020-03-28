var asm = require('../src/components/AudioStateMachine')
const sinon = require('sinon')
var audioasset = require('../src/components/audioasset')

class Group {
  start() {

  }
}

const AudioStateMachine = asm.AudioStateMachine

var chai = require('chai')
  , should = chai.should()
  , expect = chai.expect;

describe('AudioStatemachine', function () {
  it('add phrase groups', function () {
    const machine = new AudioStateMachine()
    machine.addPhraseGroup({})
  })

  it('start', function () {
    const machine = new AudioStateMachine()
    const fakeGroup = {
      start: function () { }
    }
    const fakePlayer = {
      onended: function () { },
      play: function () { }
    }
    const phraseGroupMock = sinon.mock(fakeGroup)
    const playerMock = sinon.mock(fakePlayer)
    phraseGroupMock.expects('start').once().returns(fakePlayer)
    playerMock.expects('onended').once()
    playerMock.expects('play').once()

    machine.addPhraseGroup(fakeGroup)
    machine.play(1)
  })
})
