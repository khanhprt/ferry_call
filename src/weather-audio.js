let context

export function unlockWeatherAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return
  context ||= new AudioContext()
  context.resume().catch(() => {})
}

function noiseBuffer(duration, brown = true) {
  const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate)
  const data = buffer.getChannelData(0)
  let previous = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    previous = (previous + white * .08) / 1.08
    data[i] = brown ? previous * 3.5 : white * .45
  }
  return buffer
}

export function createWeatherAudio(enabled) {
  const sources = new Set()
  let master, rainGain, disposed = false, intensity = 0

  function initialize() {
    if (disposed || !context || master) return
    master = context.createGain()
    master.gain.value = enabled ? 1 : 0
    master.connect(context.destination)
    rainGain = context.createGain()
    rainGain.gain.value = 0
    const rain = context.createBufferSource(), filter = context.createBiquadFilter()
    rain.buffer = noiseBuffer(2, false)
    rain.loop = true
    filter.type = 'lowpass'; filter.frequency.value = 2600
    rain.connect(filter).connect(rainGain).connect(master)
    rain.start()
    sources.add(rain)
  }

  return {
    setEnabled(value) {
      if (value === enabled) { if (value) initialize(); return }
      enabled = value
      if (value) initialize()
      if (master) master.gain.setTargetAtTime(value ? 1 : 0, context.currentTime, .04)
      if (rainGain) rainGain.gain.setTargetAtTime(intensity * .12, context.currentTime, .2)
    },
    setIntensity(value) {
      intensity = value
      if (enabled) initialize()
      if (rainGain) rainGain.gain.setTargetAtTime(value * .12, context.currentTime, .25)
    },
    splash(power = 1) {
      if (disposed || !enabled || !context) return
      initialize()
      const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain()
      const now = context.currentTime
      source.buffer = noiseBuffer(.3, false)
      filter.type = 'bandpass'; filter.frequency.value = 1000; filter.Q.value = .6
      gain.gain.setValueAtTime(.0001, now)
      gain.gain.exponentialRampToValueAtTime(.11 * power, now + .025)
      gain.gain.exponentialRampToValueAtTime(.0001, now + .29)
      source.connect(filter).connect(gain).connect(master)
      source.start(); sources.add(source)
      source.onended = () => { sources.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect() }
    },
    thunder(index, power = 1, delay = .2) {
      if (disposed || !enabled || !context) return
      initialize()
      const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain()
      const start = context.currentTime + delay
      source.buffer = noiseBuffer(2.5)
      source.playbackRate.value = .85
      filter.type = 'lowpass'; filter.frequency.setValueAtTime(440, start)
      filter.frequency.exponentialRampToValueAtTime(70, start + 2.5)
      gain.gain.setValueAtTime(.0001, start)
      gain.gain.exponentialRampToValueAtTime(.42 * power, start + .06)
      gain.gain.exponentialRampToValueAtTime(.18, start + .4)
      gain.gain.exponentialRampToValueAtTime(.0001, start + 2.8)
      source.connect(filter).connect(gain).connect(master)
      source.start(start)
      sources.add(source)
      source.onended = () => { sources.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect() }
    },
    dispose() {
      disposed = true
      for (const source of sources) { source.stop(); source.disconnect() }
      sources.clear()
      master?.disconnect()
    },
  }
}
