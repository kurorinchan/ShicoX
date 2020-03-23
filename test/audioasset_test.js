var assert = require('assert')
var audioasset = require('../src/components/audioasset')
const fs = require('fs')
const sinon = require('sinon')

var chai = require('chai')
  , should = chai.should()
  , expect = chai.expect;

describe('AudioAsset', function () {
  before(function () {
    const readDirMap = {
      '/root': ['shiko01', 'voice01', 'shiko02', 'voice02'],
      '/root/shiko01': ['fast', 'finish', 'nomal', 'start'],
      '/root/shiko01/fast': ['f92.wav'],
      '/root/shiko01/finish': ['count.wav', 'end01.wav', 'za02.wav', 'zb08.wav'],
      '/root/shiko01/nomal': ['01.wav', '12.wav'],
      '/root/shiko01/start': [
        'cdownxxx1.wav', 'cdown02.wav',
        's01.wav', 'sf01.wav', 'sg01.wav', 'sz01.wav'],
      '/root/voice01': ['fast', 'muon', 'nomal_s'],
      '/root/voice01/fast': ['vf01.wav'],
      '/root/voice01/muon': ['01.wav'],
      '/root/voice01/nomal_s': ['v01.wav'],
      '/root/shiko02': ['fast', 'finish', 'nomal', 'start'],
      '/root/shiko02/fast': ['f92.wav'],
      '/root/shiko02/finish': ['count.wav', 'end01.wav', 'za02.wav', 'zb08.wav'],
      '/root/shiko02/nomal': ['01.wav', '12.wav'],
      '/root/shiko02/start': [
        'cdownxxx1.wav', 'cdown02.wav',
        's01.wav', 'sf01.wav', 'sg01.wav', 'sz01.wav'],
      '/root/voice02': ['fast', 'muon', 'nomal_s'],
      '/root/voice02/fast': ['vf01.wav'],
      '/root/voice02/muon': ['01.wav'],
      '/root/voice02/nomal_s': ['v01.wav']
    }
    sinon.replace(fs, 'readdirSync', function (path) {
      return readDirMap[path]
    })
  })
  after(function () {
    sinon.restore();
  })

  describe('AssetFinder', function () {
    it('find 2 asset groups', function () {
      const stub = sinon.stub().callsFake();
      Object.setPrototypeOf(audioasset.AudioAssetGroup, stub);
      const finder = new audioasset.AssetFinder('/root')
      const groups = finder.findAudioAssetGroups()
      assert.equal(groups.length, 2)
      const groupAssetNumbers = []
      for (let group of groups) {
        groupAssetNumbers.push(group.assetGroupNumber())
      }
    })
  })

  describe('Assets', function () {
    this.beforeEach(function () {
      this.group = new audioasset.AudioAssetGroup(
        '/root/shiko01', '/root/voice01')
    })

    it('find fast shiko', function () {
      const voice = this.group.shicoFast()
      expect(voice).to.not.be.false
      expect(voice.pathForTesting).to.equal('/root/shiko01/fast/f92.wav')
    })

    it('find normal phrase', function () {
      const voice = this.group.phrase()
      expect(voice).to.not.be.false
      expect(voice.pathForTesting).to.equal('/root/voice01/nomal_s/v01.wav')
    })

    it('get asset group number to be 1', function () {
      const groupNumber = this.group.assetGroupNumber()
      expect(groupNumber).to.equal(1)
    })
  })
})
