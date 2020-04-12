const rewire = require('rewire')
const audioasset = rewire('../src/components/AssetFinder')
const mockfs = require('mock-fs')
const path = require('path')

var chai = require('chai'),
  expect = chai.expect

function fakeAudioCreateFunction() {
  return {}
}

class FakeAudioParam {
  set value(v) {}
}

class FakePanner {
  get pan() {
    return new FakeAudioParam()
  }
  connect() {}
}

class FakeAudioContext {
  createMediaElementSource() {
    return {
      connect: function() {}
    }
  }
  createStereoPanner() {
    return new FakePanner()
  }
}

function fakeAudioContextCreateFunction() {
  return new FakeAudioContext()
}

// Fake out creatAudio() function in the module. The module should not modify
// or delete the function.
audioasset.__set__('createAudio', fakeAudioCreateFunction)
audioasset.__set__('createAudioContext', fakeAudioContextCreateFunction)

describe('AudioAsset', function() {
  before(function() {
    mockfs({
      '/root': {
        shiko01: {
          fast: {
            'f92.wav': ''
          },
          finish: {
            'count.wav': '',
            'end01.wav': '',
            'za02.wav': '',
            'zb08.wav': ''
          },
          nomal: {
            '01.wav': '',
            '12.wav': ''
          },
          start: {
            'cdownxxx1.wav': '',
            'cdown02.wav': '',
            's01.wav': '',
            'sf01.wav': '',
            'sg01.wav': '',
            'sz01.wav': ''
          }
        },
        voice01: {
          fast_s: {
            'vf01.wav': ''
          },
          muon: {
            '01.wav': ''
          },
          nomal_s: {
            'v01.wav': ''
          }
        },
        // Below are 02s. The file names and dir structure is the same as
        // 01s.
        shiko02: {
          fast: {
            'f92.wav': ''
          },
          finish: {
            'count.wav': '',
            'end01.wav': '',
            'za02.wav': '',
            'zb08.wav': ''
          },
          nomal: {
            '01.wav': '',
            '12.wav': ''
          },
          start: {
            'cdownxxx1.wav': '',
            'cdown02.wav': '',
            's01.wav': '',
            'sf01.wav': '',
            'sg01.wav': '',
            'sz01.wav': ''
          }
        },
        voice02: {
          fast_s: {
            'vf01.wav': ''
          },
          muon: {
            '01.wav': ''
          },
          nomal_s: {
            'v01.wav': ''
          }
        }
      }
    })
  })
  after(function() {
    mockfs.restore()
  })

  describe('AssetFinder', function() {
    it('find 2 asset groups', function() {
      const finder = new audioasset.AssetFinder('/root')
      finder.injectAudioAssetGroupCreateFunc(function() {})
      const groups = finder.findAudioAssetGroups()
      expect(groups.length).to.equal(2)
    })
  })

  describe('Assets', function() {
    this.beforeEach(function() {
      this.group = new audioasset.AudioAssetGroup(
        '/root/shiko01',
        '/root/voice01'
      )
    })

    it('find fast shiko', function() {
      const voice = this.group.shicoFast()
      expect(voice).to.not.be.false
      expect(voice.pathForTesting).to.equal(
        path.join('/root', 'shiko01', 'fast', 'f92.wav')
      )
    })

    it('find normal phrase', function() {
      const voice = this.group.phrase()
      expect(voice).to.not.be.false
      expect(voice.pathForTesting).to.equal('/root/voice01/nomal_s/v01.wav')
    })

    it('expect asset group number to be 1', function() {
      const groupNumber = this.group.assetGroupNumber()
      expect(groupNumber).to.equal(1)
    })

    it('countdown 1 min', function() {
      const voice = this.group.perMinuteNotification(1)
      expect(voice).to.not.be.false
      expect(voice.pathForTesting).to.equal('/root/shiko01/start/cdownxxx1.wav')
    })

    it('countdown >5 min', function() {
      const voice = this.group.perMinuteNotification(6)
      expect(voice).to.not.be.false
      expect(voice.pathForTesting).to.equal('/root/shiko01/start/cdown02.wav')
    })
  })
})
