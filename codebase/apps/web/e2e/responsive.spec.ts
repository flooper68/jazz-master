import { expect, test, type Page } from './fixtures'

// Phone-width smoke (guards ISSUE-001's fix): no page may scroll horizontally
// at ~375px. jsdom cannot prove layout, so this lives at the e2e layer.

test.use({ viewport: { width: 375, height: 812 } })

async function expectNoHorizontalOverflow(page: Page, path: string) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement
    return root.scrollWidth - root.clientWidth
  })
  expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(0)
}

test('core pages fit a phone-width viewport without horizontal overflow', async ({
  page,
}) => {
  for (const path of ['/', '/app', '/app/exercises', '/app/history', '/app/routines', '/app/exercises/scales-major-open-c']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoHorizontalOverflow(page, path)
  }
})
