const fs = require('fs')
const path = require('path')

const SHIKO = 'shiko'
const VOICE = 'voice'

// These are the directory names that it should be looking for.
const FAST_DIR = 'fast'
const FAST_PHRASE_DIR = 'fast_s'
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
  const relavantFiles = []
  for (const filename of files) {
    // If there are no relevant prefixes, then all of them are relevant.
    const relevant =
      relevantPrefixes.length == 0 ||
      relevantPrefixes.reduce(
        (accum, prefix) => accum | filename.startsWith(prefix),
        false
      )
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
  return exploreDirForPrefixes(dir, [
    'cdownxxx',
    'cdown',
    's',
    'sf',
    'sg',
    'sz',
  ])
}

function preparePlayer(player) {
  player.prepare()
  return player
}

function pickRandomPlayer(array) {
  return preparePlayer(array[Math.floor(Math.random() * array.length)])
}

function findPathAndRemove(filename, paths) {
  const foundIndex = paths.findIndex(function (f) {
    return path.basename(f) == filename
  })
  if (foundIndex == -1) {
    return
  }
  const itemPath = paths[foundIndex]
  paths.splice(foundIndex, 1)
  return itemPath
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
    this.onplayendedCallback = null
    this.audio = null
    this.panner = null
    this.volume = 0
    this.assetGroup = 0
    this.panValue = 0
  }

  get assetGroupNumber() {
    return this.assetGroup
  }

  set assetGroupNumber(value) {
    this.assetGroup = value
  }

  /**
   * @param {number} panValue
   */
  set pan(panValue) {
    this.panValue = panValue
    if (this.panner) {
      this.panner.pan.value = this.panValue
    }
  }

  prepare() {
    this.audio = createAudio(this.path)
    this.audio.volume = this.volume
    this.audio.onended = this.onended.bind(this)
    const context = createAudioContext()
    const source = context.createMediaElementSource(this.audio)
    const panner = context.createStereoPanner()
    source.connect(panner)
    panner.connect(context.destination)
    this.panner = panner
    this.panner.pan.value = this.panValue
  }

  // Set a callback for when the playback ends.
  // The callback is called with this.
  set onplayended(callback) {
    this.onplayendedCallback = callback
  }

  // Called when the audio elements finish playing.
  onended() {
    if (this.onplayendedCallback) {
      this.onplayendedCallback(this)
      this.onplayendedCallback = null
    }
  }

  play() {
    console.log('playing ' + this.path)
    this.audio.play()
  }

  stop() {
    this.audio.pause()
  }

  // The value passed to this method must be in range [0, 100]
  setVolume(volume) {
    this.volume = volume / 100
    if (this.audio) {
      this.audio.volume = this.volume
    }
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
const FIVE_MIN_COUNT_DOWN_VOIDE = '5min-countdown'
const FOUR_MIN_COUNT_DOWN_VOIDE = '4min-countdown'
const THREE_MIN_COUNT_DOWN_VOIDE = '3min-countdown'
const TWO_MIN_COUNT_DOWN_VOIDE = '2min-countdown'
const ONE_MIN_COUNT_DOWN_VOIDE = '1min-countdown'
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
  const found = shicoFinishPaths.find(function (element) {
    return path.basename(element) == 'count.wav'
  })
  // TODO: handle not found.
  shicoMapping[SINGLE_FILE_COUNT_DOWN_VOICE] = [new Player(found)]

  shicoMapping[EXIT_VOICE] = allStartingWithAsPlayer('end', shicoFinishPaths)
  shicoMapping[END_VOICE] = allStartingWithAsPlayer('za', shicoFinishPaths)
  shicoMapping[ABRUPT_VOICE] = allStartingWithAsPlayer('zb', shicoFinishPaths)

  shicoMapping[LAST_MINUTE_VOICE] = allStartingWithAsPlayer(
    'sf',
    shicoStartPaths
  )
  shicoMapping[GIVE_UP_VOICE] = allStartingWithAsPlayer('sg', shicoStartPaths)
  shicoMapping[START_FAST_VOICE] = allStartingWithAsPlayer(
    'sz',
    shicoStartPaths
  )

  // These modify the array so needs more care.
  // TODO: For organizational purposes, put this in a function.
  let filePath = findPathAndRemove('cdownxxx1.wav', shicoStartPaths)
  if (filePath) {
    shicoMapping[ONE_MIN_COUNT_DOWN_VOIDE] = new Player(filePath)
  }

  filePath = findPathAndRemove('cdownxxx2.wav', shicoStartPaths)
  if (filePath) {
    shicoMapping[TWO_MIN_COUNT_DOWN_VOIDE] = new Player(filePath)
  }
  filePath = findPathAndRemove('cdownxxx3.wav', shicoStartPaths)
  if (filePath) {
    shicoMapping[THREE_MIN_COUNT_DOWN_VOIDE] = new Player(filePath)
  }
  filePath = findPathAndRemove('cdownxxx4.wav', shicoStartPaths)
  if (filePath) {
    shicoMapping[FOUR_MIN_COUNT_DOWN_VOIDE] = new Player(filePath)
  }
  filePath = findPathAndRemove('cdownxxx5.wav', shicoStartPaths)
  if (filePath) {
    shicoMapping[FIVE_MIN_COUNT_DOWN_VOIDE] = new Player(filePath)
  }

  shicoMapping[COUNT_DOWN_VOICE] = allStartingWithAsPlayer(
    'cdown',
    shicoStartPaths
  )

  const shicoStartPlayers = []
  for (const filePath of shicoStartPaths) {
    const filename = path.basename(filePath)
    if (!filename.startsWith('s')) continue

    // These have the same 's' prefix. Ignore them.
    const isOneOfOthers =
      filename.startsWith('sf') ||
      filename.startsWith('sg') ||
      filename.startsWith('sz')
    if (isOneOfOthers) continue

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
      case FAST_PHRASE_DIR:
        fastPaths = exploreDirForPrefixes(path.join(voiceDir, filename), ['vf'])
        break
      case SILENCE_DIR:
        silencePaths = exploreDirForPrefixes(path.join(voiceDir, filename), [])
        break
      case NORMAL_PHRASE_DIR:
        normalPaths = exploreDirForPrefixes(path.join(voiceDir, filename), [
          'v',
        ])
        break
    }
  }

  const pharseMapping = {}
  pharseMapping[FAST_VOICE] = pathsToPlayers(fastPaths)
  pharseMapping[SILENCE_VOICE] = pathsToPlayers(silencePaths)
  pharseMapping[PHRASE_VOICE] = pathsToPlayers(normalPaths)
  return pharseMapping
}

// This is the function that should be used in a browser to create an Audio
// element. However, while unit testing, creating it may not be ideal. So
// this is injected for testing. Do not change this.
function createAudio(path) {
  return new Audio('file://' + path)
}

// This is also overwritten for testing.
function createAudioContext() {
  return new AudioContext()
}

/**
 *
 * @callback applyToPlayerCallback
 * @param {Player} player
 */

/**
 *
 * @param {applyToPlayerCallback} applyFunc
 */
function forEveryPlayer(playersMapping, applyFunc) {
  for (const playersSubset of Object.values(playersMapping)) {
    if (Array.isArray(playersSubset)) {
      for (const player of playersSubset) {
        applyFunc(player)
      }
    } else {
      applyFunc(playersSubset)
    }
  }
}

class AudioAssetGroup {
  // TODO: The create function might be replaced by sinon's injection.
  // Also consider moving the file exploration logic out of the constructor
  // which might help better test this.
  constructor(shicoDir, voiceDir) {
    this.shicoDir = shicoDir
    this.voiceDir = voiceDir
    this.shicoVolume = INIT_VOLUME
    this.phraseVolume = INIT_VOLUME

    // TODO: These probably sholdn't not be Objects, it's clunky. Change them
    // to Maps.
    const shicoMapping = exploreShicoDir(this.shicoDir)
    const phraseMapping = exploreVoiceDir(this.voiceDir)
    const allPlayers = Object.assign(shicoMapping, phraseMapping)
    this.shicoPlayers = {}
    this.shicoPlayers[SHICO_VOICE] = allPlayers[SHICO_VOICE]
    this.shicoPlayers[SHICO_FAST_VOICE] = allPlayers[SHICO_FAST_VOICE]
    delete allPlayers[SHICO_VOICE]
    delete allPlayers[SHICO_FAST_VOICE]
    this.phrasePlayers = allPlayers

    // TODO: Calling a method in ctor is probably not a good idea as it may not
    // be completely setup. Move these non trivial operations into a seprate
    // method.
    const assetGroupNumber = this.assetGroupNumber()
    forEveryPlayer(this.phrasePlayers, function (p) {
      p.assetGroupNumber = assetGroupNumber
    })
    forEveryPlayer(this.shicoPlayers, function (p) {
      p.assetGroupNumber = assetGroupNumber
    })
  }

  // This may be just used for bookkeeping. Does not affect the functionality.
  setGroupName(name) {
    this.groupName = name
  }

  getGroupName() {
    return this.groupName
  }

  assetGroupNumber() {
    const dirname = path.basename(this.shicoDir)
    const assetNumber = dirname.substr(SHIKO.length)
    return parseInt(assetNumber)
  }

  // TODO: Update volume for all players under shiko.
  setShicoVolume(volume) {
    this.shicoVolume = clampVolume(volume)
    forEveryPlayer(this.shicoPlayers, (p) => {
      p.setVolume(this.shicoVolume)
    })
  }

  getShicoVolume() {
    return this.shicoVolume
  }

  // TODO: Update volume for all players under voice.
  setPharseVolume(volume) {
    this.phraseVolume = clampVolume(volume)
    forEveryPlayer(this.phrasePlayers, (p) => {
      p.setVolume(this.phraseVolume)
    })
  }

  getPhraseVolume() {
    return this.phraseVolume
  }

  /**
   * @param {Number} pan
   * The value must be within [-1, 1] where -1 is all the way to the left,
   * 1 is all the way to the right, and 0 is in the center. This is the same
   * as the values accepted by to StereoPannerNode.
   */
  setPhrasePan(pan) {
    forEveryPlayer(this.phrasePlayers, (p) => {
      p.pan = pan
    })
  }

  setShicoPan(pan) {
    forEveryPlayer(this.shicoPlayers, (p) => {
      p.pan = pan
    })
  }

  shico() {
    return pickRandomPlayer(this.shicoPlayers[SHICO_VOICE])
  }

  shicoFast() {
    return pickRandomPlayer(this.shicoPlayers[SHICO_FAST_VOICE])
  }

  start() {
    return pickRandomPlayer(this.phrasePlayers[START_VOICE])
  }

  startFast() {
    return pickRandomPlayer(this.phrasePlayers[START_FAST_VOICE])
  }

  phrase() {
    return pickRandomPlayer(this.phrasePlayers[PHRASE_VOICE])
  }

  silence() {
    return pickRandomPlayer(this.phrasePlayers[SILENCE_VOICE])
  }

  perMinuteNotification(minutesRemaining) {
    if (
      minutesRemaining == 5 &&
      FIVE_MIN_COUNT_DOWN_VOIDE in this.phrasePlayers
    ) {
      return preparePlayer(this.phrasePlayers[FIVE_MIN_COUNT_DOWN_VOIDE])
    }
    if (
      minutesRemaining == 4 &&
      FOUR_MIN_COUNT_DOWN_VOIDE in this.phrasePlayers
    ) {
      return preparePlayer(this.phrasePlayers[FOUR_MIN_COUNT_DOWN_VOIDE])
    }
    if (
      minutesRemaining == 3 &&
      THREE_MIN_COUNT_DOWN_VOIDE in this.phrasePlayers
    ) {
      return preparePlayer(this.phrasePlayers[THREE_MIN_COUNT_DOWN_VOIDE])
    }
    if (
      minutesRemaining == 2 &&
      TWO_MIN_COUNT_DOWN_VOIDE in this.phrasePlayers
    ) {
      return preparePlayer(this.phrasePlayers[TWO_MIN_COUNT_DOWN_VOIDE])
    }
    if (
      minutesRemaining == 1 &&
      ONE_MIN_COUNT_DOWN_VOIDE in this.phrasePlayers
    ) {
      return preparePlayer(this.phrasePlayers[ONE_MIN_COUNT_DOWN_VOIDE])
    }

    // If there isn't any >5 min countdowns, then play at random.
    return pickRandomPlayer(this.phrasePlayers[COUNT_DOWN_VOICE])
  }

  abrupt() {
    return pickRandomPlayer(this.phrasePlayers[ABRUPT_VOICE])
  }

  giveup() {
    return pickRandomPlayer(this.phrasePlayers[GIVE_UP_VOICE])
  }

  lastMinute() {
    return pickRandomPlayer(this.phrasePlayers[LAST_MINUTE_VOICE])
  }

  fast() {
    return pickRandomPlayer(this.phrasePlayers[FAST_VOICE])
  }

  countDown() {
    const player = this.phrasePlayers[SINGLE_FILE_COUNT_DOWN_VOICE][0]
    player.prepare()
    return player
  }

  end() {
    return pickRandomPlayer(this.phrasePlayers[END_VOICE])
  }

  exit() {
    return pickRandomPlayer(this.phrasePlayers[EXIT_VOICE])
  }
}

class AssetFinder {
  constructor(assetDir) {
    this.dir = assetDir
    this.audioAssetGroupCreateFunc = function (dir1, dir2) {
      return new AudioAssetGroup(dir1, dir2)
    }
  }

  injectAudioAssetGroupCreateFunc(ctor) {
    this.audioAssetGroupCreateFunc = ctor
  }

  // TODO: Consider returning a promise here so that it doesn't need to be
  // synchronous.
  findAudioAssetGroups() {
    const files = fs.readdirSync(this.dir)

    const assetGroups = []
    for (const filename of files) {
      if (!filename.startsWith(SHIKO)) continue

      const assetNumber = filename.substr(SHIKO.length)
      const voicename = VOICE + assetNumber
      files.includes(voicename)
      const shicoDir = path.join(this.dir, filename)
      const voiceDir = path.join(this.dir, voicename)

      assetGroups.push(this.audioAssetGroupCreateFunc(shicoDir, voiceDir))
    }
    return assetGroups
  }
}

module.exports = {
  AudioAssetGroup,
  AssetFinder,
  Player,
}
