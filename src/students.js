import { tr } from './i18n.js'
const atlas = new Image()
atlas.src = `${import.meta.env.BASE_URL}students/classmates.png`

// All three poses in a column belong to the same child. Trim transparent cell
// margins at load time so the feet and head sizes line up across poses.
let sprites
export const studentsReady = atlas.decode().then(() => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const width = atlas.naturalWidth / 4, height = atlas.naturalHeight / 3
  sprites = Array.from({ length: 4 }, (_, column) => Array.from({ length: 3 }, (_, row) => {
    canvas.width = Math.ceil(width); canvas.height = Math.ceil(height)
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(atlas, column * width, row * height, width, height, 0, 0, width, height)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
    let left = canvas.width, top = canvas.height, right = 0, bottom = 0
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      if (pixels.data[(y * canvas.width + x) * 4 + 3] > 100) {
        left = Math.min(left, x); top = Math.min(top, y)
        right = Math.max(right, x); bottom = Math.max(bottom, y)
      }
    }
    const output = document.createElement('canvas')
    output.width = right - left + 5; output.height = bottom - top + 5
    output.getContext('2d').drawImage(canvas, left - 2, top - 2, output.width, output.height, 0, 0, output.width, output.height)
    return output.toDataURL('image/png')
  }))
}).catch(error => { console.error('Không tải được bộ nhân vật học sinh.', error) })

export function studentVariant(student) {
  const hash = [...student.name].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return (student.gender === 'Nữ' ? 2 : 0) + hash % 2
}

export function studentImage(student, pose = 0) {
  return sprites?.[studentVariant(student)]?.[pose] || `${import.meta.env.BASE_URL}${student.gender === 'Nữ' ? 'girl' : 'boy'}-reference.png`
}

export function seatedLayout(students) {
  // These coordinates belong to the 3:1 boat artwork, so the pupils stay inside
  // the hull when the whole assembly moves, rolls, or changes size.
  const rows = Math.min(4, Math.max(1, Math.ceil(students.length / 12)))
  const columns = Math.ceil(students.length / rows)
  return students.map((student, index) => {
    const row = Math.floor(index / columns), column = index % columns
    const count = Math.min(columns, students.length - row * columns)
    const noise = ((index * 17) % 7 - 3) * .13
    // The near gunwale rises towards the bow. Shorten the forward rows so
    // children's faces stay above the curved rim instead of behind the tip.
    const span = 51 + Math.min(2, rows - 1 - row) * 3.1
    return {
      student,
      x: 33.1 + (column + .5) * (span / count) + (row % 2 ? .98 : -.49),
      y: 70.7 - (rows - 1 - row) * 14.6 + noise * 2.36,
      size: Math.min(7.26, 72.6 / columns) * (1 - (rows - 1 - row) * .045),
      row,
      delay: -index * .31,
      idle: ['idle-sway', 'idle-curious', 'idle-settle'][index % 3],
      period: 2.8 + (index * 7 % 9) * .19,
      lean: (index % 2 ? 1 : -1) * (1.1 + index % 4 * .25),
    }
  })
}

export function walkToShore(student, seat, scene, onShore) {
  const rect = seat.getBoundingClientRect(), bounds = scene.getBoundingClientRect()
  seat.classList.add('seat-vacated')
  const walker = document.createElement('div')
  walker.className = 'shore-student'
  walker.dataset.walker = student.id
  const name = document.createElement('span')
  name.className = 'passenger-name'
  name.textContent = student.name.split(' ').slice(-2).join(' ')
  walker.append(name)
  for (let pose = 1; pose <= 2; pose++) {
    const image = document.createElement('img')
    image.src = studentImage(student, pose)
    image.alt = pose === 1 ? tr`${student.name} đang lên bờ` : ''
    image.className = `walk-frame walk-frame-${pose}`
    walker.append(image)
  }
  scene.querySelector('.shore-passengers').append(walker)
  const startX = (rect.left + rect.width / 2 - bounds.left) / bounds.width * 100
  const startY = (rect.bottom - bounds.top) / bounds.height * 100
  const distance = Math.max(40, 106 - startX)
  const travelDuration = distance * 48
  const offsetAt = x => Math.max(.01, (x - startX) / distance)
  const point = (x, y, scale = 1) => ({ left: `${x}%`, top: `${y}%`, transform: `translate(-50%,-100%) scale(${scale})` })
  const animation = walker.animate([
    { ...point(startX, startY, .9), offset: 0 },
    { ...point(64.5, 80, .98), offset: offsetAt(64.5) },
    { ...point(69.2, 77, .98), offset: offsetAt(69.2) },
    { ...point(73.6, 73.5), offset: offsetAt(73.6) },
    { ...point(106, 73.5), offset: 1 },
  ], { duration: travelDuration, easing: 'linear', fill: 'forwards' })
  const arrival = setTimeout(() => { if (scene.isConnected && walker.isConnected) onShore?.() }, offsetAt(73.6) * travelDuration)
  return animation.finished.catch(() => {}).then(() => { clearTimeout(arrival); walker.remove() })
}
