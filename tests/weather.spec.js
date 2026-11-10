import { test, expect } from '@playwright/test'

const rainyPixels = page => page.locator('.weather-rain').evaluate(canvas => {
  const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
  let count = 0
  for (let i = 3; i < data.length; i += 4) if (data[i]) count++
  return count
})

test('river flows through storm, lightning, rain, and clearing without disrupting the boat', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.clock.install({ time: new Date('2026-11-10T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-11-10T00:00:01Z'))
  await page.goto('http://127.0.0.1:5180')
  await page.getByRole('button', { name: 'Nhanh', exact: true }).click()
  await page.locator('[data-action="launch"]').click()
  const scene = page.locator('.game')
  await expect(scene).toHaveAttribute('data-weather', 'calm')
  await expect(page.locator('.river-current')).toHaveCount(2)
  await expect(page.locator('.surf-wave')).toHaveCount(3)
  await expect(page.locator('.wave-frame')).toHaveCount(12)
  await expect(page.locator('.hull-wake')).toBeVisible()
  await page.screenshot({ path: 'tmp/weather-calm.png' })

  await page.clock.runFor(1350)
  const orangeFish = page.locator('.flying-fish[data-fish-color="0"]')
  await expect(orangeFish).toBeVisible()
  await expect(orangeFish).toHaveAttribute('data-jump-state', 'rising')
  await expect(page.locator('.river-burst').first()).toBeAttached()
  const risingPosition = await orangeFish.boundingBox()
  await page.screenshot({ path: 'tmp/river-fish.png' })
  await page.clock.runFor(250)
  await expect(orangeFish).toHaveAttribute('data-jump-state', 'diving')
  expect((await orangeFish.boundingBox()).x).toBeGreaterThan(risingPosition.x)
  const poses = new Set()
  const events = new Set(), resetEvents = new Set()
  let largestWidth = 0, distorted = false, crestCaptured = false
  const sampleWaves = async () => {
    const states = await page.locator('.surf-wave').evaluateAll(nodes => nodes.map(node => ({
      state: node.dataset.waveState, event: node.dataset.waveEvent,
      width: node.getBoundingClientRect().width / node.closest('.game').getBoundingClientRect().width,
      opacity: Number(getComputedStyle(node).opacity), matrix: getComputedStyle(node).transform,
    })))
    for (const item of states) {
      poses.add(item.state)
      if (item.state === 'rest' && item.event) resetEvents.add(item.event)
      if (item.state !== 'rest') {
        events.add(item.event)
        if (item.opacity > .5) largestWidth = Math.max(largestWidth, item.width)
        const components = item.matrix.match(/matrix\(([^)]+)\)/)?.[1].split(',').map(Number)
        if (components && Math.abs(components[0] - components[3]) > .08) distorted = true
        if (!crestCaptured && item.state === 'crest' && item.width > .3 && item.opacity > .8) {
          await page.screenshot({ path: 'tmp/waves-popup.png' }); crestCaptured = true
        }
      }
    }
  }
  for (let i = 0; i < 24; i++) { await page.clock.runFor(100); await sampleWaves() }
  for (const pose of ['rising', 'crest', 'breaking', 'foam']) expect(poses.has(pose)).toBe(true)
  await expect(scene).toHaveAttribute('data-weather', 'storm')
  await expect(page.locator('.flying-fish[data-fish-color="1"]')).toBeVisible()
  await expect.poll(() => rainyPixels(page)).toBeGreaterThan(500)
  await page.locator('[data-game="sound"]').click()
  await expect(scene).toHaveAttribute('data-weather-sound', 'off')
  await expect(scene).toHaveAttribute('data-lightning-count', '2')
  await expect(page.locator('.weather-bolt')).toHaveAttribute('data-bolt-shape', '1')
  await page.locator('.weather-bolt').evaluate(node => node.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 150 }))
  await expect.poll(() => page.locator('.weather-bolt').evaluate(node => Number(getComputedStyle(node).opacity))).toBeGreaterThan(0)
  await page.screenshot({ path: 'tmp/weather-storm.png' })

  await page.locator('.weather-bolt').evaluate(node => node.getAnimations().forEach(animation => animation.play()))
  for (let i = 0; i < 26; i++) { await page.clock.runFor(100); await sampleWaves() }
  expect(events.size).toBeGreaterThanOrEqual(3)
  expect(resetEvents.size).toBeGreaterThan(0)
  expect(largestWidth).toBeLessThan(.45)
  expect(distorted).toBe(true)
  expect(crestCaptured).toBe(true)
  await page.clock.runFor(1000)
  await expect(scene).toHaveAttribute('data-weather', 'clear', { timeout: 5000 })
  await expect(scene).toHaveAttribute('data-storm-strength', '0.000')
  await expect.poll(() => rainyPixels(page)).toBe(0)
  await expect(scene).not.toHaveClass(/\bstorm\b/)
  await expect(page.locator('.river-current-front')).toBeVisible()
  await expect(page.locator('.weather-bolt')).toBeHidden()
  await expect.poll(() => page.locator('.weather-shade').evaluate(node => Number(getComputedStyle(node).opacity))).toBe(0)
  await page.screenshot({ path: 'tmp/weather-cleared.png' })
  await page.locator('[data-game="stop"]').click()
  await expect(page.locator('.weather-rain')).toHaveCount(0)
  await expect(page.locator('.flying-fish,.river-burst')).toHaveCount(0)
  await page.clock.runFor(800)
  expect(errors).toEqual([])
})

test('the existing story setting keeps weather effects with OS reduced motion enabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.install({ time: new Date('2026-11-10T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-11-10T00:00:01Z'))
  await page.goto('http://127.0.0.1:5180')
  await page.getByRole('button', { name: 'Nhanh', exact: true }).click()
  await page.locator('[data-action="launch"]').click()
  const seen = new Set()
  for (let i = 0; i < 40; i++) {
    await page.clock.runFor(100)
    const states = await page.locator('.surf-wave').evaluateAll(nodes => nodes.map(node => node.dataset.waveState))
    states.forEach(state => seen.add(state))
  }
  await expect(page.locator('.game')).toHaveAttribute('data-weather', 'storm')
  await expect(page.locator('.game')).toHaveAttribute('data-fish-jumps', '2')
  await expect(page.locator('.game')).toHaveAttribute('data-lightning-count', '2')
  expect(seen.has('crest')).toBe(true)
  await page.locator('[data-game="stop"]').click()
})
