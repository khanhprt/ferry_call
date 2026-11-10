import { createWeatherAudio } from './weather-audio.js'
import { createStormWaves, renderStormWaves } from './storm-waves.js'
import { createRiverLife, renderRiverLife } from './river-life.js'
import { createTeacher } from './teacher.js'
import './weather.css'

export const weatherReady = Promise.all([`${import.meta.env.BASE_URL}weather/wave-cycle.png`, `${import.meta.env.BASE_URL}weather/jumping-fish.png`, `${import.meta.env.BASE_URL}weather/clouds.png`].map(source => {
  const image = new Image()
  image.src = source
  return image.decode()
}))

function waterTile(id) {
  return `<svg viewBox="0 0 3200 240" preserveAspectRatio="none" aria-hidden="true"><defs><g id="${id}">
    <path class="current-band" d="M0 65 C150 5 260 115 400 65 S650 5 800 65 S1050 115 1200 65 S1450 5 1600 65 V240 H0Z"/>
    <path class="current-foam" d="M0 65 C150 5 260 115 400 65 S650 5 800 65 S1050 115 1200 65 S1450 5 1600 65"/>
    <path class="current-thread" d="M25 112 Q90 95 175 108 M305 167 Q380 144 470 161 M610 117 Q710 102 815 114 M965 190 Q1080 160 1190 178 M1330 118 Q1420 100 1525 116"/>
    <path class="current-thread faint" d="M100 207 Q230 179 350 199 M510 205 Q600 182 690 198 M900 136 Q975 123 1045 135 M1270 218 Q1380 192 1480 206"/>
  </g></defs><use href="#${id}"/><use href="#${id}" x="1600"/></svg>`
}

export function renderWeather() {
  return `<div class="weather-shade weather-decoration" aria-hidden="true"></div>
    <div class="weather-clouds weather-decoration" aria-hidden="true"></div>
    <div class="clearing-light weather-decoration" aria-hidden="true"></div>
    <div class="river-current river-current-back weather-decoration">${waterTile('river-back-tile')}</div>
    <div class="river-current river-current-front weather-decoration">${waterTile('river-front-tile')}</div>
    ${renderStormWaves()}
    ${renderRiverLife()}
    <canvas class="weather-rain weather-decoration" aria-hidden="true"></canvas>
    <svg class="weather-bolt weather-decoration" viewBox="0 0 110 200" data-bolt-shape="0" aria-hidden="true">
      <g class="bolt-shape bolt-shape-0"><path d="M64 4 L17 102 L49 94 L31 190 L99 72 L64 81 L86 8Z"/></g>
      <g class="bolt-shape bolt-shape-1"><path d="M67 4 L26 85 L57 78 L32 189 L98 66 L66 74 L87 6Z"/><path class="bolt-branch" d="M55 81 L15 116 L30 143 M74 71 L99 98 L87 121"/></g>
      <g class="bolt-shape bolt-shape-2"><path d="M41 5 L13 78 L44 75 L21 164 L57 116 L44 192 L100 92 L65 103 L84 51 L53 62 L64 7Z"/></g>
    </svg>
    <div class="weather-flash weather-decoration" aria-hidden="true"></div>`
}

const smoothstep = (a, b, value) => {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export function createWeather(scene, { soundEnabled, duration }) {
  const canvas = scene.querySelector('.weather-rain'), context = canvas.getContext('2d')
  const bolt = scene.querySelector('.weather-bolt'), flash = scene.querySelector('.weather-flash')
  const audio = createWeatherAudio(soundEnabled()), media = { matches: false } // the story animations are the point of the game, so the OS animation setting does not switch them off
  const activeAnimations = new Set(), strikes = [.32, .49, .65]
  const life = createRiverLife(scene, { onSplash: power => audio.splash(power), reducedMotion: () => media.matches })
  const waves = createStormWaves(scene, { duration, onBreak: life.splash, reducedMotion: () => media.matches })
  const teacher = createTeacher(scene, { duration, reducedMotion: () => media.matches })
  const rain = Array.from({ length: 175 }, (_, index) => ({
    x: ((index * 73) % 191) / 191, y: ((index * 43) % 179) / 179,
    speed: .68 + (index % 7) * .09, front: index % 3 === 0,
  }))
  let width = 0, height = 0, strength = 0, frame = 0, previousFrame = 0, strikeIndex = 0, disposed = false

  function resize() {
    const bounds = scene.getBoundingClientRect(), ratio = Math.min(devicePixelRatio || 1, 2)
    width = bounds.width; height = bounds.height
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio)
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
  }
  const observer = new ResizeObserver(resize)
  observer.observe(scene)
  resize()

  function animate(element, keyframes, options) {
    const animation = element.animate(keyframes, options)
    activeAnimations.add(animation)
    animation.finished.catch(() => {}).then(() => activeAnimations.delete(animation))
  }

  function strike(index, progress) {
    scene.dataset.lightningCount = String(index + 1)
    bolt.style.left = `${[43, 65, 29][index]}%`
    bolt.style.top = `${[13, 9, 14][index]}%`
    bolt.dataset.boltShape = String(index)
    waves.pulse(progress)
    if (!media.matches) {
      animate(bolt, [{ opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: .9, offset: .65 }, { opacity: 0 }], { duration: 650, easing: 'ease-out' })
      animate(flash, [{ opacity: 0 }, { opacity: .28, offset: .08 }, { opacity: .04, offset: .25 }, { opacity: .12, offset: .38 }, { opacity: 0 }], { duration: 650, easing: 'ease-out' })
      animate(scene.querySelector('.weather-clouds'), [{ filter: 'brightness(1)' }, { filter: 'brightness(1.45)', offset: .15 }, { filter: 'brightness(1)' }], { duration: 500 })
      animate(scene.querySelector('.boat-wrap'), [{ translate: '0 0' }, { translate: '0 -.45cqh', offset: .3 }, { translate: '0 .2cqh', offset: .65 }, { translate: '0 0' }], { duration: 420 })
    }
    audio.thunder(index, [0.8, 1, .9][index], [.25, .18, .3][index])
  }

  function drawRain(now) {
    if (disposed || !scene.isConnected) return
    frame = requestAnimationFrame(drawRain)
    if (now - previousFrame < 30) return
    const step = Math.min((now - previousFrame) / 1000, .06)
    previousFrame = now
    context.clearRect(0, 0, width, height)
    life.draw(now, width)
    if (strength < .01) return
    const motion = media.matches ? .3 : 1
    for (const drop of rain) {
      drop.x -= step * .25 * drop.speed * motion
      drop.y += step * drop.speed * motion
      if (drop.y > 1.08) { drop.y = -.08; drop.x = (drop.x + .37) % 1 }
      if (drop.x < -.08) drop.x = 1.08
      const length = height * (drop.front ? .05 : .03), x = drop.x * width, y = drop.y * height
      context.beginPath(); context.moveTo(x, y); context.lineTo(x - length * .36, y + length)
      context.strokeStyle = drop.front ? `rgba(239,250,255,${strength * .7})` : `rgba(214,233,246,${strength * .32})`
      context.lineWidth = Math.max(.6, width / 1440 * (drop.front ? 1.4 : .8))
      context.stroke()
    }
    // Elliptical raindrop rings are restricted to the foreground water.
    for (let i = 0; i < 22; i++) {
      const age = (now / 1050 + i * .37) % 1
      const radius = (2 + age * 9) * width / 1440
      context.beginPath()
      context.ellipse(((i * 137 % 997) / 997) * width, (.87 + (i * 11 % 13) / 100) * height, radius * 2, radius * .45, 0, 0, Math.PI * 2)
      context.strokeStyle = `rgba(224,252,255,${(1 - age) * strength * .55})`
      context.lineWidth = Math.max(.6, width / 1440)
      context.stroke()
    }
  }
  frame = requestAnimationFrame(drawRain)
  scene.dataset.lightningCount = '0'

  return {
    update(progress) {
      if (disposed) return
      strength = smoothstep(.13, .28, progress) * (1 - smoothstep(.69, .94, progress))
      const phase = progress < .13 ? 'calm' : progress < .28 ? 'gathering' : progress < .69 ? 'storm' : progress < .96 ? 'clearing' : 'clear'
      scene.dataset.weather = phase
      scene.dataset.stormStrength = strength.toFixed(3)
      scene.style.setProperty('--storm-strength', strength.toFixed(3))
      scene.style.setProperty('--clearing-light', (smoothstep(.71, .86, progress) * (1 - smoothstep(.92, 1, progress))).toFixed(3))
      scene.classList.toggle('storm', strength > .35)
      scene.classList.toggle('storm-peak', progress > .43 && progress < .72)
      life.update(progress)
      waves.update(progress)
      teacher.update(progress)
      while (strikeIndex < strikes.length && progress >= strikes[strikeIndex]) strike(strikeIndex++, progress)
      audio.setEnabled(soundEnabled())
      audio.setIntensity(strength)
      scene.dataset.weatherSound = soundEnabled() ? 'on' : 'off'
    },
    setSound(enabled) {
      audio.setEnabled(enabled)
      scene.dataset.weatherSound = enabled ? 'on' : 'off'
    },
    celebrate() { teacher.celebrate() },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      for (const animation of activeAnimations) animation.cancel()
      activeAnimations.clear()
      context.clearRect(0, 0, width, height)
      life.dispose()
      teacher.dispose()
      audio.dispose()
    },
  }
}
