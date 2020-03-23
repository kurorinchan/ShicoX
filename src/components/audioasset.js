
const fs = require('fs')
const path = require('path')

const SHIKO = 'shiko'
const VOICE = 'voice'

// These are the directory names that it should be looking for.
const FAST_DIR = 'fast'
const FINISH_DIR = 'finish'
const NORMAL_DIR = 'nomal'
const START_DIR = 'start'
const SILENCE_DIR = 'muon'
const NORMAL_PHRASE_DIR = 'nomal_s'

// Volume realted constants.
const INIT_VOLUME = 100
const MAX_VOLUME = 100
const MIN_VOLUME = 0

function clampVolume(volume) {
  return Math.max(MIN_VOLUME, Math.min(MAX_VOLUME, volume))
}

function exploreDirForPrefixes(dir, relevantPrefixes) {
  const files = fs.readdirSync(dir)
  relavantFiles = []
  for (const filename of files) {
    // If there are no relevant prefixes, then all of them are relevant.
    const relevant =
      relevantPrefixes.length == 0 ||
      relevantPrefixes.reduce(
        (accum, prefix) => accum | filename.startsWith(prefix), false)
    if (!relevant) {
      continue
    }

    if (path.extname(filename) != '.wav') {
      continue
    }

    relavantFiles.push(path.join(dir, filename))
  }
  return relavantFiles
}

function exploreShicoFast(dir) {
  return exploreDirForPrefixes(dir, ['f'])
}

function exploreShicoNormal(dir) {
  return exploreDirForPrefixes(dir, [])
}

function exploreShicoFinish(dir) {
  return exploreDirForPrefixes(dir, ['count', 'end', 'za', 'zb'])
}

function exploreShicoStart(dir) {
  return exploreDirForPrefixes(dir, ['cdownxxx', 'cdown', 's', 'sf', 'sg', 'sz'])
}

function pickRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function allStartingWithAsPlayer(prefix, paths) {
  const players = []
  for (const filePath of paths) {
    if (path.basename(filePath).startsWith(prefix)) {
      players.push(new Player(filePath))
    }
  }
  return players
}

class Player {
  constructor(audioFilePath) {
    this.path = audioFilePath
    this.audio = null
  }

  play() {
    this.audio.play()
  }

  setVolume(volume) {
    this.audio.volume = volume
  }

  get pathForTesting() {
    return this.path
  }
}

function pathsToPlayers(paths) {
  const players = []
  for (const p of paths) {
    players.push(new Player(p))
  }
  return players
}

const START_FAST_VOICE = 'startfast'
const START_VOICE = 'start'
const SHICO_VOICE = 'shico'
const PHRASE_VOICE = 'phrase'
const SILENCE_VOICE = 'silence'
const ABRUPT_VOICE = 'abrupt'
const GIVE_UP_VOICE = 'giveup'
const LAST_MINUTE_VOICE = 'lastminute'
const FAST_VOICE = 'fast'
const SHICO_FAST_VOICE = 'shicofast'
const COUNT_DOWN_VOICE = 'countdown'
// This is the single file that has "5,4,3,2,1"
const SINGLE_FILE_COUNT_DOWN_VOICE = 'single-file-count-down-voice'
const END_VOICE = 'end'
const EXIT_VOICE = 'exit'

function exploreShicoDir(shicoDir) {
  const files = fs.readdirSync(shicoDir)
  let shicoFastPaths = null
  let shicoNormalPaths = null
  let shicoFinishPaths = null
  let shicoStartPaths = null

  for (const filename of files) {
    switch (filename) {
      case FAST_DIR:
        shicoFastPaths = exploreShicoFast(path.join(shicoDir, filename))
        break
      case NORMAL_DIR:
        shicoNormalPaths = exploreShicoNormal(path.join(shicoDir, filename))
        break
      case FINISH_DIR:
        shicoFinishPaths = exploreShicoFinish(path.join(shicoDir, filename))
        break
      case START_DIR:
        shicoStartPaths = exploreShicoStart(path.join(shicoDir, filename))
        break
    }
  }

  // TODO: Handle the case when one of them is not populated.
  const shicoMapping = {}
  shicoMapping[SHICO_FAST_VOICE] = pathsToPlayers(shicoFastPaths)
  shicoMapping[SHICO_VOICE] = pathsToPlayers(shicoNormalPaths)

  // TODO: Make a constant for the string.
  const found = shicoFinishPaths.find(
    function (element) {
      path.basename(element) == 'count.wav'
    }
  )
  // TODO: handle not found.
  shicoMapping[SINGLE_FILE_COUNT_DOWN_VOICE] = [new Player(found)]

  shicoMapping[EXIT_VOICE] = allStartingWithAsPlayer('end', shicoFinishPaths)
  shicoMapping[END_VOICE] = allStartingWithAsPlayer('za', shicoFinishPaths)
  shicoMapping[ABRUPT_VOICE] = allStartingWithAsPlayer('zb', shicoFinishPaths)

  shicoMapping[LAST_MINUTE_VOICE] = allStartingWithAsPlayer('sf', shicoStartPaths)
  shicoMapping[GIVE_UP_VOICE] = allStartingWithAsPlayer('sg', shicoStartPaths)
  shicoMapping[START_FAST_VOICE] = allStartingWithAsPlayer('sz', shicoStartPaths)
  shicoMapping[COUNT_DOWN_VOICE] = allStartingWithAsPlayer('cdown', shicoStartPaths)

  const shicoStartPlayers = []
  for (const filePath of shicoStartPaths) {
    const filename = path.basename(filePath)
    if (!filename.startsWith('s'))
      continue

    // These have the same 's' prefix. Ignore them.
    const isOneOfOthers =
      filename.startsWith('sf') ||
      filename.startsWith('sg') ||
      filename.startsWith('sz')
    if (isOneOfOthers)
      continue

    shicoStartPlayers.push(new Player(filePath))
  }
  shicoMapping[START_VOICE] = shicoStartPlayers

  return shicoMapping
}

function exploreVoiceDir(voiceDir) {
  const files = fs.readdirSync(voiceDir)
  let fastPaths = null
  let silencePaths = null
  let normalPaths = null

  for (const filename of files) {
    switch (filename) {
      case FAST_DIR:
        fastPaths = exploreDirForPrefixes(path.join(voiceDir, filename), ['vf'])
        break
      case SILENCE_DIR:
        silencePaths = exploreDirForPrefixes(path.join(voiceDir, filename), [])
        break
      case NORMAL_PHRASE_DIR:
        normalPaths = exploreDirForPrefixes(path.join(voiceDir, filename), ['v'])
        break
    }
  }

  const pharseMapping = {}
  pharseMapping[FAST_VOICE] = pathsToPlayers(fastPaths)
  pharseMapping[SILENCE_VOICE] = pathsToPlayers(silencePaths)
  pharseMapping[PHRASE_VOICE] = pathsToPlayers(normalPaths)
  return pharseMapping
}

class AudioAssetGroup {
  constructor(shicoDir, voiceDir) {
    this.shicoDir = shicoDir
    this.voiceDir = voiceDir
    this.shicoVolume = INIT_VOLUME
    this.phraseVolume = INIT_VOLUME

    const shicoMapping = exploreShicoDir(this.shicoDir)
    const phraseMapping = exploreVoiceDir(this.voiceDir)
    this.allPlayers = Object.assign(shicoMapping, phraseMapping)
  }

  assetGroupNumber() {
    const dirname = path.basename(this.shicoDir)
    const assetNumber = dirname.substr(SHIKO.length)
    return parseInt(assetNumber)
  }

  setShicoVolume(volume) {
    this.shicoVolume = clampVolume(volume)
  }

  setPharseVolume(volume) {
    this.phraseVolume = clampVolume(volume)
  }

  startFast() {
    return pickRandomElement(this.allPlayers[START_FAST_VOICE])
  }

  shico() {
    return pickRandomElement(this.allPlayers[SHICO_VOICE])
  }

  phrase() {
    return pickRandomElement(this.allPlayers[PHRASE_VOICE])
  }

  silence() {
    return pickRandomElement(this.allPlayers[SILENCE_VOICE])
  }

  perMinuteNofitication(minutesRemaining) {
    // TODO: use minutesRemaining to choose the right per minute.
    if (minutesRemaining > 5) {
      return pickRandomElement(this.allPlayers[COUNT_DOWN_VOICE])
    }
    return pickRandomElement(this.allPlayers[COUNT_DOWN_VOICE])
  }

  abrupt() {
    return pickRandomElement(this.allPlayers[ABRUPT_VOICE])
  }

  giveup() {
    return pickRandomElement(this.allPlayers[GIVE_UP_VOICE])
  }

  lastMinute() {
    return pickRandomElement(this.allPlayers(LAST_MINUTE_VOICE))
  }

  fast() {
    return pickRandomElement(this.allPlayers[FAST_VOICE])
  }

  shicoFast() {
    return pickRandomElement(this.allPlayers[SHICO_FAST_VOICE])
  }

  countDown() {
    return this.allPlayers[SINGLE_FILE_COUNT_DOWN_VOICE][0]
  }

  end() {
    return pickRandomElement(this.allPlayers[END_VOICE])
  }

  exit() {
    return pickRandomElement(this.allPlayers[EXIT_VOICE])
  }
}

class AssetFinder {
  constructor(assetDir) {
    this.dir = assetDir
  }

  // TODO: Consider returning a promise here so that it doesn't need to be
  // synchronous.
  findAudioAssetGroups() {
    const files = fs.readdirSync(this.dir)

    const assetGroups = []
    for (const filename of files) {
      if (!filename.startsWith(SHIKO))
        continue;

      const assetNumber = filename.substr(SHIKO.length)
      const voicename = VOICE + assetNumber
      files.includes(voicename)
      const shicoDir = path.join(this.dir, filename)
      const voiceDir = path.join(this.dir, voicename)

      assetGroups.push(new AudioAssetGroup(shicoDir, voiceDir))
    }
    return assetGroups
  }
}

module.exports = {
  AudioAssetGroup,
  AssetFinder
}
