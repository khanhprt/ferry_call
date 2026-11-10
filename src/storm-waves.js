const poses = ['rising', 'crest', 'breaking', 'foam']
const waveSpecs = [
  { name: 'left', x: [0, 14], width: [20, 25] },
  { name: 'right', x: [55, 68], width: [22, 27] },
  { name: 'breaker', x: [14, 30], width: [32, 37] },
]

function makeRandom() {
  let seed = crypto.getRandomValues(new Uint32Array(1))[0] || 1
  return () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5
    return (seed >>> 0) / 4294967296
  }
}

function scheduleWaves(duration) {
  const random = makeRandom(), between = (min, max) => min + random() * (max - min)
  const first = [0, 1, 2], freeAt = [0, 0, 0], events = []
  for (let i = first.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[first[i], first[j]] = [first[j], first[i]]
  }
  let at = duration * .2 + between(0, 260), previous = -1
  while (at < duration * .81) {
    const available = waveSpecs.map((_, index) => index).filter(index => freeAt[index] <= at && index !== previous)
    if (!available.length) { at = Math.max(at + 140, Math.min(...freeAt.filter((_, index) => index !== previous)) + 140); continue }
    let lane = first.length ? first.shift() : available[Math.floor(random() * available.length)]
    if (freeAt[lane] > at) lane = available[0]
    const spec = waveSpecs[lane], lifetime = between(1250, lane === 2 ? 1900 : 1600)
    events.push({ id: events.length + 1, lane, at, lifetime,
      x: between(...spec.x), width: between(...spec.width),
      direction: random() < .5 ? -1 : 1, skew: between(-14, 14), drift: between(-9, 9),
    })
    freeAt[lane] = at + lifetime + between(400, 850)
    previous = lane
    at += between(1000, 1550)
  }
  return events
}

export function renderStormWaves() {
  return `<div class="storm-surf weather-decoration" aria-hidden="true">${waveSpecs.map(spec => `
    <div class="surf-wave storm-wave surf-${spec.name}" data-wave-state="rest" data-wave="${spec.name}" style="--wave-direction:1">
      <div class="wave-art">${poses.map((pose, index) => `<span class="wave-frame wave-frame-${index}" data-pose="${pose}" style="background-position:${index % 2 ? '100%' : '0%'} ${index > 1 ? '100%' : '0%'}"></span>`).join('')}</div>
    </div>`).join('')}</div>`
}

export function createStormWaves(scene, { duration, onBreak, reducedMotion }) {
  const actors = waveSpecs.map(spec => ({ element: scene.querySelector(`[data-wave="${spec.name}"]`), event: null }))
  const events = scheduleWaves(duration)
  let next = 0, shockAt = -Infinity, changes = 0
  scene.dataset.waveChanges = '0'; scene.dataset.waveEvents = '0'; scene.dataset.activeWaves = '0'

  function rest(actor) {
    actor.event = null
    actor.element.style.opacity = '0'; actor.element.style.visibility = 'hidden'
    actor.element.dataset.waveState = 'rest'
  }

  return {
    pulse(progress) { shockAt = progress * duration },
    update(progress) {
      const elapsed = progress * duration
      while (next < events.length && elapsed >= events[next].at) {
        const event = events[next++], actor = actors[event.lane]
        actor.event = { ...event, broke: false, lastPose: '' }
        actor.element.style.left = `${event.x}%`; actor.element.style.width = `${event.width}%`
        actor.element.style.setProperty('--wave-direction', event.direction)
        actor.element.dataset.waveEvent = String(event.id)
        scene.dataset.waveEvents = String(next)
      }
      let count = 0
      for (const actor of actors) {
        const event = actor.event
        if (!event || elapsed - event.at >= event.lifetime || progress >= .94) { rest(actor); continue }
        const t = Math.max(0, (elapsed - event.at) / event.lifetime)
        const phase = reducedMotion() ? .37 : t
        const frame = Math.min(3, Math.floor(phase * 4))
        const blend = Math.max(0, Math.min(1, ((phase * 4 % 1) - .6) / .4))
        actor.element.querySelectorAll('.wave-frame').forEach((node, index) => {
          node.style.opacity = index === frame ? String(frame === 3 ? 1 : 1 - blend) : index === frame + 1 ? String(blend) : '0'
        })
        actor.element.dataset.waveState = poses[frame]
        if (event.lastPose !== poses[frame]) { event.lastPose = poses[frame]; scene.dataset.waveChanges = String(++changes) }
        const envelope = Math.min(1, t / .11, (1 - t) / .18)
        const pulse = Math.max(0, 1 - (elapsed - shockAt) / 450) * .045
        const emerge = Math.min(1, t / .18), recede = Math.max(0, (t - .76) / .24)
        const spring = Math.sin(Math.PI * emerge)
        const scaleX = .5 + emerge * .5 + spring * .18 + recede * .22 + pulse
        const scaleY = .12 + emerge * .88 + spring * .15 - recede * .64 + pulse
        const skew = event.skew * (1 - emerge) + Math.sin(t * Math.PI * 2) * 2
        actor.element.style.visibility = 'visible'
        actor.element.style.opacity = String(Math.max(0, envelope))
        actor.element.style.transform = reducedMotion() ? 'none' : `translate(${(t - .5) * event.drift}%,${(1 - emerge) * 24 + recede * 14}%) skewX(${skew}deg) scale(${scaleX},${scaleY})`
        if (frame === 2 && !event.broke && !reducedMotion()) {
          event.broke = true
          onBreak?.(event.x + event.width * .5, 94, event.width / 48)
        }
        count++
      }
      scene.dataset.activeWaves = String(count)
    },
  }
}
