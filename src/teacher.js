import { t, tr } from './i18n.js'
import './teacher.css'

const sprites = { female: [], male: [] }
const portraits = {}
const sources = { female: `${import.meta.env.BASE_URL}teachers/female-states-red.png`, male: `${import.meta.env.BASE_URL}teachers/male-states.png` }

export const teachersReady = Promise.all([
  ...Object.entries(sources).map(async ([kind, source]) => {
    const image = new Image(); image.src = source
    await image.decode()
    const canvas = document.createElement('canvas'), context = canvas.getContext('2d')
    const width = image.naturalWidth / 2, height = image.naturalHeight / 3
    canvas.width = Math.round(width); canvas.height = Math.round(height)
    // Keep the original cell registration: hands, oar, face and feet all use
    // the same coordinate system instead of trimming each pose separately.
    for (let pose = 0; pose < 6; pose++) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, pose % 2 * width, Math.floor(pose / 2) * height, width, height, 0, 0, canvas.width, canvas.height)
      sprites[kind].push(canvas.toDataURL('image/png'))
    }
    const portrait = document.createElement('canvas')
    portrait.width = 96; portrait.height = 96
    portrait.getContext('2d').drawImage(image, width * .1, height * 2, width * .72, height * .72, 0, 0, 96, 96)
    portraits[kind] = portrait.toDataURL('image/png')
  }),
  (async () => { const hat = new Image(); hat.src = `${import.meta.env.BASE_URL}teachers/flying-hat.png`; await hat.decode() })(),
])

export function teacherPortrait(kind) {
  return portraits[kind] || sources[kind]
}

export function renderTeacher(teacher) {
  const kind = teacher === 'Cô' ? 'female' : 'male'
  return tr`<div class="ferry-teacher teacher-character teacher-animated" data-teacher-kind="${kind}" data-state="rowing" data-pose="0"><img class="teacher-sprite" src="${sprites[kind][0]}" alt="${t(teacher)} đang chèo đò"></div>`
}

export function createTeacher(scene, { duration, reducedMotion }) {
  const actor = scene.querySelector('.teacher-animated'), image = actor.querySelector('.teacher-sprite')
  const kind = actor.dataset.teacherKind, title = kind === 'female' ? 'Cô' : 'Thầy'
  const hat = document.createElement('img')
  hat.className = 'flying-teacher-hat'; hat.src = `${import.meta.env.BASE_URL}teachers/flying-hat.png`; hat.alt = ''; hat.setAttribute('aria-hidden', 'true')
  scene.append(hat)
  let pose = -1, laughing = false, disposed = false, lostLogged = false, returnedLogged = false
  scene.dataset.rowingStrokes = '0'

  function setPose(next, state) {
    if (pose !== next) {
      if (pose >= 0 && pose < 2 && next < 2) scene.dataset.rowingStrokes = String(Number(scene.dataset.rowingStrokes) + 1)
      image.src = sprites[kind][next]
      pose = next
      actor.dataset.pose = String(next)
    }
    actor.dataset.state = state
    scene.dataset.teacherState = state
    image.alt = `${t(title)} ${state === 'rowing' || state === 'storm-rowing' ? t('đang chèo đò') : state === 'hat-blown' ? t('bị gió thổi bay nón') : state === 'catching-hat' ? t('đang đón nón bay về') : state === 'laughing' ? t('đang cười vui') : t('đang vẫy tay')}`
  }

  function note(text) {
    const list = scene.querySelector('#journey-log')
    const item = document.createElement('span'); item.textContent = text; list.prepend(item)
    while (list.children.length > 4) list.lastElementChild.remove()
  }

  function hideHat(state) {
    hat.style.visibility = 'hidden'; hat.style.opacity = '0'
    hat.dataset.state = state; scene.dataset.teacherHat = state
  }

  function flyHat(t, returning) {
    const state = returning ? 'returning' : 'flying-away'
    hat.dataset.state = state; scene.dataset.teacherHat = state
    if (reducedMotion()) { hat.style.visibility = 'hidden'; return }
    const bounds = scene.getBoundingClientRect(), body = image.getBoundingClientRect()
    const originX = (body.left + body.width * .43 - bounds.left) / bounds.width * 100
    const originY = (body.top + body.height * .13 - bounds.top) / bounds.height * 100
    const x = returning ? originX - 20 * (1 - t) + Math.sin(Math.PI * t) * 6 : originX - 24 * t + Math.sin(Math.PI * t) * 6
    const y = returning ? originY - 32 * (1 - t) - Math.sin(Math.PI * t) * 7 : originY - 39 * t - Math.sin(Math.PI * t) * 6
    hat.style.width = `${body.width * .95}px`
    hat.style.left = `${x}%`; hat.style.top = `${y}%`
    hat.style.opacity = String(returning ? Math.min(1, t * 8) : 1 - Math.max(0, (t - .83) / .17))
    hat.style.visibility = 'visible'
    const rotation = returning ? -300 * (1 - t) : -400 * t
    const scale = returning ? .65 + t * .35 : 1 - t * .35
    hat.style.transform = `translate(-50%,-50%) rotate(${rotation}deg) scale(${scale})`
  }

  return {
    update(progress) {
      if (disposed) return
      if (laughing) { setPose(5, 'laughing'); hideHat('worn'); return }
      if (progress < .22) { setPose(reducedMotion() ? 0 : Math.floor(progress * duration / 520) % 2, 'rowing'); hideHat('worn') }
      else if (progress < .32) { setPose(2, 'hat-blown'); flyHat((progress - .22) / .18, false) }
      else if (progress < .4) { setPose(3, 'storm-rowing'); flyHat((progress - .22) / .18, false) }
      else if (progress < .7) { setPose(3, 'storm-rowing'); hideHat('away') }
      else if (progress < .84) { setPose(2, 'catching-hat'); flyHat((progress - .7) / .14, true) }
      else { setPose(4, progress >= 1 ? 'docked' : 'relieved'); hideHat('worn') }
      if (progress >= .22 && !lostLogged) { note(tr`Gió thổi bay nón của ${t(title)}!`); lostLogged = true }
      if (progress >= .84 && !returnedLogged) { note(tr`Nón của ${t(title)} bay về rồi!`); returnedLogged = true }
    },
    celebrate() { if (!disposed) { laughing = true; setPose(5, 'laughing'); hideHat('worn') } },
    dispose() { disposed = true; hat.remove() },
  }
}
