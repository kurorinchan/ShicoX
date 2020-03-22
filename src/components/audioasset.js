
const fs = require('fs')

class AudioAssetGroup {
  constructor (shicoDir, voiceDir) {
    this.shicoDir = shicoDir
    this.voiceDir = voiceDir
  }
}

class AssetFinder {
  constructor (assetDir) {
    this.dir = assetDir
    fs.readdir(this.dir, function (dir) {
      console.log(dir)
      for (const filePath of dir) {
        console.log(filePath)
      }
    })
  }

  findAudioAssetGroups () {
    return []
  }
}

module.exports = {
  AudioAssetGroup,
  AssetFinder
}
