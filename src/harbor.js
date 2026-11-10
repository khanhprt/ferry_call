import './harbor.css'

export const harborReady = Promise.all(['/scene/river-open.png', '/scene/dock.png'].map(source => {
  const image = new Image(); image.src = source
  return image.decode()
}))

export function renderHarbor() {
  return '<div class="arrival-dock" data-state="hidden" aria-hidden="true"><img src="/scene/dock.png" alt=""></div>'
}

export function createHarbor(scene) {
  const dock = scene.querySelector('.arrival-dock'), media = { matches: false } // the story animations are the point of the game, so the OS animation setting does not switch them off
  let currentProgress = 0, disposed = false

  function place(progress) {
    if (disposed) return
    currentProgress = progress
    const bounds = scene.getBoundingClientRect()
    const visibleLeft = Math.max(0, -bounds.left)
    const visibleRight = Math.min(bounds.width, innerWidth - bounds.left)
    const viewportCenter = (visibleLeft + visibleRight) / 2 / bounds.width * 100
    // The registered hull occupies x=-0.7..70.9% in the docked composition.
    const centeredShift = viewportCenter - 35.1
    const approach = Math.max(0, Math.min(1, (progress - .9) / .1))
    const eased = media.matches ? (progress >= 1 ? 1 : 0) : approach * approach * (3 - 2 * approach)
    scene.style.setProperty('--boat-shift', `${centeredShift * (1 - eased)}%`)
    const state = progress >= 1 ? 'docked' : progress >= .9 ? 'approaching' : 'sailing'
    scene.dataset.harborState = state
    dock.dataset.state = state === 'sailing' ? 'hidden' : state
    dock.style.visibility = eased > 0 ? 'visible' : 'hidden'
    dock.style.opacity = String(eased)
    dock.style.transform = `translateX(${(1 - eased) * 12}%)`
  }
  const observer = new ResizeObserver(() => place(currentProgress))
  observer.observe(scene)
  place(0)

  return {
    update: place,
    dispose() { disposed = true; observer.disconnect() },
  }
}
