// Two small V-shaped flocks that cross the clearing sky, like the birds at the end of the reference video.
const birdFlocks = [
  { count: 7, gap: 4.6, lift: 2.2, size: 4.6, top: 15, duration: 17, delay: -3 },
  { count: 5, gap: 3.8, lift: 1.8, size: 3.6, top: 27, duration: 23, delay: -14 },
]
export function renderRiverLife() {
  return `<div class="river-life weather-decoration" aria-hidden="true"><div class="fish-layer"></div><div class="river-splashes"></div></div>
    <div class="sky-birds weather-decoration" aria-hidden="true">${birdFlocks.flatMap((flock, f) => Array.from({ length: flock.count }, (_, k) => `<svg class="river-bird" style="--flock:${f};--k:${k};--dx:${(-k * flock.gap).toFixed(1)}cqw;--dy:${(Math.abs(k - (flock.count - 1) / 2) * flock.lift).toFixed(1)}cqh;--w:${(flock.size - Math.abs(k - flock.count / 2) * .08).toFixed(2)}cqw;--base:${flock.top}cqh;--dur:${flock.duration}s;--delay:${flock.delay}s;--flap:${(.5 + (k % 3) * .06).toFixed(2)}s" viewBox="0 0 80 35"><path d="M4 23 Q20 4 40 23 Q60 4 76 23"/></svg>`)).join('')}</div>`
}

export function createRiverLife(scene, { onSplash, reducedMotion }) {
  const fishLayer = scene.querySelector('.fish-layer'), sprayLayer = scene.querySelector('.river-splashes')
  const fish = [], sprays = []
  const scheduled = [
    { at: .09, color: 0, from: 77, to: 88, water: 95, height: 16, duration: 1700 },
    { at: .39, color: 1, from: 67, to: 80, water: 96, height: 24, duration: 1850 },
    { at: .79, color: 0, from: 14, to: 31, water: 96, height: 22, duration: 1750 },
    { at: .86, color: 1, from: 89, to: 76, water: 95, height: 17, duration: 1650 },
  ]
  let next = 0, disposed = false, progress = 0, nextQuietJump = Infinity
  scene.dataset.fishJumps = '0'

  function splash(x, y, power = 1) {
    if (disposed || reducedMotion()) return
    const element = document.createElement('div')
    element.className = 'river-burst'
    element.style.left = `${x}%`; element.style.top = `${y}%`
    element.innerHTML = '<span class="burst-ring"></span>' + Array.from({ length: 7 }, () => '<i class="burst-drop"></i>').join('')
    sprayLayer.append(element)
    sprays.push({ element, created: performance.now(), power })
    onSplash?.(power)
  }

  function jump(spec) {
    if (disposed || reducedMotion()) return
    const element = document.createElement('div')
    element.className = 'flying-fish'
    element.dataset.fishColor = String(spec.color)
    element.dataset.jumpState = 'rising'
    const first = `0% ${spec.color ? '100%' : '0%'}`
    const second = `100% ${spec.color ? '100%' : '0%'}`
    element.innerHTML = `<span class="fish-pose fish-pose-up" style="background-position:${first}"></span><span class="fish-pose fish-pose-down" style="background-position:${second}"></span>`
    fishLayer.append(element)
    fish.push({ ...spec, element, created: performance.now(), landed: false })
    scene.dataset.fishJumps = String(Number(scene.dataset.fishJumps) + 1)
    splash(spec.from, spec.water, .45)
  }

  return {
    update(value) {
      progress = value
      while (next < scheduled.length && value >= scheduled[next].at) jump(scheduled[next++])
      if (value >= 1 && nextQuietJump === Infinity) nextQuietJump = performance.now() + 6000
    },
    splash,
    draw(now, width) {
      if (disposed) return
      if (progress >= 1 && now >= nextQuietJump && !scene.classList.contains('winner-focused') && !scene.querySelector('.result-overlay')) {
        jump({ color: next % 2, from: 75, to: 88, water: 96, height: 15, duration: 1650 })
        nextQuietJump = now + 7500
      }
      for (let i = fish.length - 1; i >= 0; i--) {
        const item = fish[i], t = Math.min(1, (now - item.created) / item.duration)
        const x = item.from + (item.to - item.from) * t
        const y = item.water - 4 * item.height * t * (1 - t)
        const direction = item.to >= item.from ? 1 : -1
        item.element.style.left = `${x}%`; item.element.style.top = `${y}%`
        item.element.style.opacity = Math.min(1, t * 10, (1 - t) * 10)
        item.element.style.transform = `translate(-50%,-50%) scaleX(${direction}) rotate(${-32 + t * 78}deg)`
        item.element.dataset.jumpState = t < .45 ? 'rising' : 'diving'
        item.element.style.setProperty('--fish-turn', Math.max(0, Math.min(1, (t - .38) / .24)).toFixed(3))
        if (t > .92 && !item.landed) { splash(item.to, item.water, .9); item.landed = true }
        if (t >= 1) { item.element.remove(); fish.splice(i, 1) }
      }
      for (let i = sprays.length - 1; i >= 0; i--) {
        const item = sprays[i], t = (now - item.created) / 850
        if (t >= 1) { item.element.remove(); sprays.splice(i, 1); continue }
        const scale = width / 1440 * item.power
        item.element.style.opacity = (1 - t).toFixed(3)
        item.element.querySelector('.burst-ring').style.transform = `translate(-50%,-50%) scale(${.4 + 2 * t})`
        item.element.querySelectorAll('.burst-drop').forEach((drop, index) => {
          const x = (index - 3) * 16 * t * scale
          const y = (-Math.sin((index + 1) / 8 * Math.PI) * 85 * Math.sin(Math.PI * t) + 12 * t) * scale
          drop.style.transform = `translate(${x}px,${y}px) rotate(${(index - 3) * 16}deg)`
        })
      }
    },
    dispose() {
      disposed = true
      for (const item of [...fish, ...sprays]) item.element.remove()
      fish.length = 0; sprays.length = 0
    },
  }
}
