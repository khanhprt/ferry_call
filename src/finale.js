import { studentImage, studentVariant } from './students.js'
import './finale.css'

const frames = [], portraits = []
const poseIndex = { sleeping: 0, waking: 1, awake: 2 }
const sheet = new Image()
sheet.src = '/students/finale.png'

export const finaleReady = sheet.decode().then(() => {
  const canvas = document.createElement('canvas'), context = canvas.getContext('2d', { willReadFrequently: true })
  const width = sheet.naturalWidth / 4, height = sheet.naturalHeight / 3
  for (let column = 0; column < 4; column++) {
    frames[column] = []
    for (let row = 0; row < 3; row++) {
      canvas.width = Math.ceil(width); canvas.height = Math.ceil(height)
      context.drawImage(sheet, column * width, row * height, width, height, 0, 0, canvas.width, canvas.height)
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
      let left = canvas.width, top = canvas.height, right = 0, bottom = 0
      for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
        if (pixels[(y * canvas.width + x) * 4 + 3] > 100) {
          left = Math.min(left, x); right = Math.max(right, x)
          top = Math.min(top, y); bottom = Math.max(bottom, y)
        }
      }
      const output = document.createElement('canvas')
      output.width = right - left + 5; output.height = bottom - top + 5
      output.getContext('2d').drawImage(canvas, left - 2, top - 2, output.width, output.height, 0, 0, output.width, output.height)
      frames[column][row] = output.toDataURL('image/png')
      if (row === 2) {
        const portrait = document.createElement('canvas'); portrait.width = 192; portrait.height = 192
        const cropHeight = Math.min(output.height, output.width * 1.05)
        portrait.getContext('2d').drawImage(output, 0, 0, output.width, cropHeight, 0, 0, 192, 192)
        portraits[column] = portrait.toDataURL('image/png')
      }
    }
  }
})

export const finaleImage = (student, pose) => frames[studentVariant(student)]?.[poseIndex[pose]] || studentImage(student)
export const winnerPortrait = student => portraits[studentVariant(student)] || studentImage(student)

export function sleepStudent(seat, student) {
  seat.querySelector('.seated-sprite').src = finaleImage(student, 'sleeping')
  seat.querySelector('.seated-sprite').alt = `${student.name} đang ngủ quên trên đò`
  seat.classList.add('sleepy-student')
  seat.dataset.studentState = 'sleeping'
  seat.dataset.characterVariant = String(studentVariant(student))
}

export function createWinnerFinale(scene, student, { onWake }) {
  const seat = scene.querySelector(`[data-passenger="${student.id}"]`)
  const image = seat.querySelector('.seated-sprite'), name = seat.querySelector('.passenger-name')
  const title = scene.querySelector('.journey-title'), speech = scene.querySelector('.speech')
  const originalImage = studentImage(student)
  const vignette = document.createElement('div')
  vignette.className = 'winner-vignette'; vignette.setAttribute('aria-hidden', 'true')
  scene.append(vignette)
  const glow = document.createElement('div')
  glow.className = 'winner-glow'; glow.setAttribute('aria-hidden', 'true')
  glow.innerHTML = [[12, 40], [80, 20], [92, 65], [27, 12], [52, 4]].map(([x, y], index) => `<i style="left:${x}%;top:${y}%;--twinkle-delay:${index * -.29}s">✦</i>`).join('')
  const dialog = document.createElement('div')
  dialog.className = 'winner-dialog'
  seat.append(glow, dialog)
  seat.classList.add('winner-student')
  scene.classList.add('winner-focused')
  speech.textContent = `${student.name.split(' ').slice(-2).join(' ')} ơi, tới bờ rồi con!`
  let resolveFinished
  const finished = new Promise(resolve => { resolveFinished = resolve })
  let frame = 0, state = '', done = false
  const start = performance.now()

  function setState(next) {
    if (state === next) return
    state = next
    seat.dataset.studentState = next
    scene.dataset.finaleStage = next
    image.src = finaleImage(student, next)
    image.alt = `${student.name} ${next === 'sleeping' ? 'đang ngủ quên' : next === 'waking' ? 'đang dụi mắt tỉnh dậy' : 'đã tỉnh dậy'}`
    seat.classList.toggle('sleepy-student', next === 'sleeping')
    dialog.textContent = next === 'waking' ? 'Ơ… tới bờ rồi ạ?' : next === 'awake' ? 'Dạ… em dậy rồi ạ!' : ''
    dialog.hidden = next === 'sleeping'
    if (next === 'waking') onWake?.()
  }

  function positionFocus() {
    const bounds = scene.getBoundingClientRect(), body = image.getBoundingClientRect(), seatBounds = seat.getBoundingClientRect()
    vignette.style.setProperty('--focus-x', `${body.left + body.width / 2 - bounds.left}px`)
    vignette.style.setProperty('--focus-y', `${body.top + body.height * .42 - bounds.top}px`)
    vignette.style.setProperty('--focus-rx', `${Math.max(body.width * 1.5, bounds.width * .095)}px`)
    vignette.style.setProperty('--focus-ry', `${Math.max(body.height * .9, bounds.height * .16)}px`)
    const labelTop = body.top - seatBounds.top - name.offsetHeight - 7
    seat.style.setProperty('--winner-label-y', `${labelTop}px`)
    seat.style.setProperty('--winner-dialog-y', `${labelTop - dialog.offsetHeight - 9}px`)
  }

  function finish(success) {
    if (done) return
    done = true
    cancelAnimationFrame(frame)
    vignette.remove()
    resolveFinished(success)
  }

  function draw(now) {
    if (done) return
    if (!scene.isConnected) return finish(false)
    const elapsed = now - start
    setState(elapsed < 1450 ? 'sleeping' : elapsed < 2100 ? 'waking' : 'awake')
    title.textContent = elapsed < 650 ? 'Ai còn trên đò?' : ''
    positionFocus()
    if (elapsed >= 3300) return finish(true)
    frame = requestAnimationFrame(draw)
  }

  setState('sleeping')
  positionFocus()
  frame = requestAnimationFrame(draw)
  return {
    finished,
    dispose() {
      finish(false)
      glow.remove(); dialog.remove(); vignette.remove()
      seat.classList.remove('winner-student', 'sleepy-student')
      seat.style.removeProperty('--winner-label-y'); seat.style.removeProperty('--winner-dialog-y')
      image.src = originalImage
      scene.classList.remove('winner-focused')
    },
  }
}
