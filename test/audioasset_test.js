var audioasset = require('../src/components/AssetFinder')
const fs = require('fs')
const sinon = require('sinon')
const jsdom = require('jsdom')

var chai = require('chai'),
  should = chai.should(),
  expect = chai.expect

function fakeAudioCreateFunction(path) {
  return {}
}

describe('AudioAsset', function() {
  before(function() {
    const readDirMap = {
      '/root': ['shiko01', 'voice01', 'shiko02', 'voice02'],
      '/root/shiko01': ['fast', 'finish', 'nomal', 'start'],
      '/root/shiko01/fast': ['f92.wav'],
      '/root/shiko01/finish': [
        'count.wav',
        'end01.wav',
        'za02.wav',
        'zb08.wav'
      ],
      '/root/shiko01/nomal': ['01.wav', '12.wav'],
      '/root/shiko01/start': [
        'cdownxxx1.wav',
        'cdown02.wav',
        's01.wav',
        'sf01.wav',
        'sg01.wav',
        'sz01.wav'
      ],
      '/root/voice01': ['fast_s', 'muon', 'nomal_s'],
      '/root/voice01/fast_s': ['vf01.wav'],
      '/root/voice01/muon': ['01.wav'],
      '/root/voice01/nomal_s': ['v01.wav'],
      '/root/shiko02': ['fast', 'finish', 'nomal', 'start'],
      '/root/shiko02/fast': ['f92.wav'],
      '/root/shiko02/finish': [
        'count.wav',
        'end01.wav',
        'za02.wav',
        'zb08.wav'
      ],
      '/root/shiko02/nomal': ['01.wav', '12.wav'],
      '/root/shiko02/start': [
        'cdownxxx1.wav',
        'cdown02.wav',
        's01.wav',
        'sf01.wav',
        'sg01.wav',
        'sz01.wav'
      ],
      '/root/voice02': ['fast_s', 'muon', 'nomal_s'],
      '/root/voice02/fast_s': ['vf01.wav'],
      '/root/voice02/muon': ['01.wav'],
      '/root/voice02/nomal_s': ['v01.wav']
    }
    sinon.replace(fs, 'readdirSync', function(path) {
      return readDirMap[path]
    })
  })
  after(function() {
    sinon.restore()
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
      // TODO: Consider using jsDOM and sinon to mock window.Audio.
      this.group = new audioasset.AudioAssetGroup(
        '/root/shiko01',
        '/root/voice01',
        fakeAudioCreateFunction
      )
    })

    it('find fast shiko', function() {
      const voice = this.group.shicoFast()
      expect(voice).to.not.be.false
      expect(voice.pathForTesting).to.equal('/root/shiko01/fast/f92.wav')
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
