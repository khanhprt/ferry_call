import { test, expect } from '@playwright/test'

test('pupils sit in staggered rows, walk to the pier, and leave one winner', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://127.0.0.1:5180')
  await page.getByRole('button', { name: 'Nhanh', exact: true }).click()
  await page.locator('[data-action="launch"]').click()
  await expect(page.locator('.passenger')).toHaveCount(36)
  await expect(page.locator('.seated-sprite').first()).toHaveAttribute('src', /^data:image\/png/)
  await expect(page.locator('.teacher-character')).toHaveAttribute('data-teacher-kind', 'female')
  await expect(page.locator('.teacher-character img')).toHaveAttribute('src', /^data:image\/png/)
  await expect(page.locator('#journey-title')).toHaveText('Khởi hành!')
  await expect(page.locator('.ferry-rear')).toHaveAttribute('src', '/ferry_call/boat/rear.png')
  await expect(page.locator('.ferry-front')).toHaveAttribute('src', '/ferry_call/boat/front.png')
  expect(await page.locator('.ferry-front').evaluate(image => getComputedStyle(image).clipPath)).toBe('none')
  await page.screenshot({ path: 'tmp/students-seated.png' })
  const rows = await page.locator('.passenger').evaluateAll(nodes => new Set(nodes.map(node => node.style.getPropertyValue('--layer'))).size)
  expect(rows).toBe(3)
  const idlePeriods = await page.locator('.seated-character').evaluateAll(nodes => new Set(nodes.map(node => getComputedStyle(node).animationDuration)).size)
  expect(idlePeriods).toBeGreaterThan(1)
  await expect(page.locator('.shore-student').first()).toBeVisible({ timeout: 10000 })
  await expect(page.locator('.seat-vacated').first()).toBeHidden()
  await expect(page.locator('.shore-student').first().locator('.walk-frame')).toHaveCount(2)
  await page.waitForTimeout(1600)
  await page.screenshot({ path: 'tmp/students-walking.png' })
  await page.getByRole('button', { name: 'Tên: hiện', exact: true }).click()
  await expect(page.locator('.shore-student .passenger-name').first()).toBeHidden()
  await expect(page.locator('.result-overlay')).toBeVisible({ timeout: 20000 })
  await expect(page.locator('.passenger:not(.seat-vacated)')).toHaveCount(1)
  await expect(page.locator('#remaining')).toHaveText('1')
  await expect(page.locator('.shore-student')).toHaveCount(0)
  await page.getByRole('button', { name: 'Chuyến đò mới' }).click()
  await expect(page.locator('.passenger')).toHaveCount(36)
  await page.getByRole('button', { name: 'Dừng', exact: true }).click()
  await page.waitForTimeout(4000)
  await expect(page.locator('.result-overlay')).toHaveCount(0)
  await expect(page.locator('[data-action="launch"]')).toBeVisible()
  expect(errors).toEqual([])
})

test('the separate transparent hull layers actually frame the occupants', async ({ page }) => {
  await page.goto('http://127.0.0.1:5180')
  await page.locator('[data-action="launch"]').click()
  await expect(page.locator('.ferry-front')).toBeVisible()
  await page.addStyleTag({ content: '.boat-wrap,.boat-stage,.teacher-character,.seated-character,.seated-sprite{animation:none!important}' })
  const layers = await page.locator('.ferry-layer').evaluateAll(images => images.map(image => {
    const canvas = document.createElement('canvas')
    canvas.width = 300; canvas.height = 100
    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0, 300, 100)
    const alphaAt = (x, y) => context.getImageData(x, y, 1, 1).data[3]
    return { upperOpening: alphaAt(150, 25), seatArea: alphaAt(150, 55), lowerHull: alphaAt(150, 80), rectangle: image.getBoundingClientRect().toJSON() }
  }))
  expect(layers[0].upperOpening).toBe(0)
  expect(layers[0].seatArea).toBeGreaterThan(200)
  expect(layers[1].upperOpening).toBe(0)
  expect(layers[1].seatArea).toBe(0)
  expect(layers[1].lowerHull).toBeGreaterThan(200)
  expect(layers[0].rectangle).toEqual(layers[1].rectangle)
  const composition = await page.locator('.ferry-assembly').evaluate(boat => {
    const back = boat.querySelector('.ferry-rear'), people = boat.querySelector('.ferry-occupants'), front = boat.querySelector('.ferry-front')
    return [back, people, front].map(node => Number(getComputedStyle(node).zIndex))
  })
  expect(composition[0]).toBeLessThan(composition[1])
  expect(composition[1]).toBeLessThan(composition[2])
  const coveredFaces = await page.locator('.ferry-assembly').evaluate(boat => {
    const front = boat.querySelector('.ferry-front'), bounds = front.getBoundingClientRect()
    const canvas = document.createElement('canvas')
    canvas.width = front.naturalWidth; canvas.height = front.naturalHeight
    const context = canvas.getContext('2d')
    context.drawImage(front, 0, 0)
    return [...boat.querySelectorAll('.seated-sprite')].filter(image => {
      const face = image.getBoundingClientRect()
      const x = Math.floor((face.left + face.width / 2 - bounds.left) / bounds.width * canvas.width)
      const y = Math.floor((face.top + face.height * .3 - bounds.top) / bounds.height * canvas.height)
      return context.getImageData(x, y, 1, 1).data[3] > 100
    }).length
  })
  expect(coveredFaces).toBe(0)
  await page.screenshot({ path: 'tmp/boat-layered.png' })
})

test('the scene keeps students aligned with the boat in a portrait viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('http://127.0.0.1:5180')
  await page.locator('[data-action="launch"]').click()
  await expect(page.locator('.passenger')).toHaveCount(36)
  const scene = await page.locator('.game').boundingBox()
  expect(scene.width / scene.height).toBeCloseTo(16 / 9, 1)
  await page.screenshot({ path: 'tmp/students-mobile.png' })
  await page.locator('[data-game="stop"]').click()
})
