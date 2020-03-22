var assert = require('assert')
const audioasset = require('../src/components/audioasset')

describe('Array', function () {
  describe('#indexOf()', function () {
    it('should return -1 when the value is not present', function () {
      assert.equal([1, 2, 3].indexOf(4), -1)
    })
  })
})

describe('AudioAsset', function () {
  describe('find', function () {
    it('should find dires', function () {
      new audioasset.AssetFinder('file:///media/psf/ASSAM/dmm/d_072497')
    })
  })
})
