import { test, expect } from '@playwright/test'

const boatCenter = async page => {
  const bounds = await page.locator('.ferry-front').boundingBox()
  return bounds.x + bounds.width / 2
}

test('the boat sails centered and the pier appears only at arrival before boarding', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.clock.install({ time: new Date('2026-11-10T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-11-10T00:00:01Z'))
  await page.goto('http://127.0.0.1:5180')
  await page.getByRole('button', { name: 'Nhanh', exact: true }).click()
  await page.locator('[data-action="launch"]').click()
  const scene = page.locator('.game'), dock = page.locator('.arrival-dock')
  await expect(scene).toHaveAttribute('data-harbor-state', 'sailing')
  await expect(dock).toBeHidden()
  expect(await scene.evaluate(node => getComputedStyle(node).backgroundImage)).toContain('/scene/river-open.png')
  expect(Math.abs(await boatCenter(page) - 720)).toBeLessThan(6)
  await page.screenshot({ path: 'tmp/sailing-centered.png' })

  await page.clock.runFor(4000)
  await expect(scene).toHaveAttribute('data-weather', 'storm')
  await expect(dock).toBeHidden()
  expect(Math.abs(await boatCenter(page) - 720)).toBeLessThan(12)
  await page.clock.runFor(2350)
  await expect(dock).toBeHidden()
  await expect(page.locator('.shore-student')).toHaveCount(0)

  await page.clock.runFor(500)
  await expect(scene).toHaveAttribute('data-harbor-state', 'approaching')
  await expect(dock).toBeVisible()
  expect(await boatCenter(page)).toBeLessThan(680)
  await expect(page.locator('.shore-student')).toHaveCount(0)

  await page.clock.runFor(550)
  await expect(scene).toHaveAttribute('data-harbor-state', 'docked')
  expect(await dock.evaluate(node => Number(getComputedStyle(node).opacity))).toBe(1)
  expect(Math.abs(await boatCenter(page) - 1440 * .351)).toBeLessThan(6)
  await page.screenshot({ path: 'tmp/arrival-docked.png' })
  await page.clock.runFor(2200)
  await expect(page.locator('.shore-student').first()).toBeVisible()
  await page.screenshot({ path: 'tmp/arrival-boarding.png' })
  await page.locator('[data-game="stop"]').click()
  await page.locator('[data-action="launch"]').click()
  await expect(dock).toBeHidden()
  await expect(scene).toHaveAttribute('data-harbor-state', 'sailing')
  expect(Math.abs(await boatCenter(page) - 720)).toBeLessThan(6)
  await page.locator('[data-game="stop"]').click()
  expect(errors).toEqual([])
})

test('centering follows the visible viewport when the river is cropped or in portrait', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('http://127.0.0.1:5180')
  await page.locator('[data-action="launch"]').click()
  await expect(page.locator('.ferry-front')).toBeVisible()
  await expect.poll(async () => Math.abs(await boatCenter(page) - 640)).toBeLessThan(8)
  await expect(page.locator('.arrival-dock')).toBeHidden()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(async () => Math.abs(await boatCenter(page) - 195)).toBeLessThan(6)
  await expect(page.locator('.arrival-dock')).toBeHidden()
  await page.locator('[data-game="stop"]').click()
})
