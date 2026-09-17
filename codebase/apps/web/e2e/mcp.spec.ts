import { expect, test } from './fixtures'

const exercise = {
  title: 'E2E — Fmaj7 arpeggio, first position',
  area: 'arpeggios',
  level: 1,
  tempoBpm: 70,
  duration: { kind: 'repetitions', count: 2 },
  key: 'F',
  notes: [
    { string: 4, fret: 3, beats: 1 },
    { string: 3, fret: 2, beats: 1 },
    { string: 2, fret: 1, beats: 1 },
    { string: 1, fret: 0, beats: 1 },
  ],
}

test('an exercise created over MCP shows up in the app and plays', async ({ page }) => {
  await page.goto('/app/exercises')
  await expect(page.getByRole('heading', { level: 1, name: 'Exercises' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: exercise.title })).toHaveCount(0)

  // The MCP call, made as the same signed-in user the page is.
  const created = await page.evaluate(async (candidate) => {
    const response = await fetch('/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'create_exercise', arguments: { exercise: candidate } } }),
    })
    return (await response.json()) as { result: { isError?: boolean; structuredContent: { status: string; exercise?: { id: string } } } }
  }, exercise)
  expect(created.result.isError).toBeFalsy()
  expect(created.result.structuredContent.status).toBe('ok')

  await page.reload()
  const card = page.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 3, name: exercise.title }) })
  await expect(card.getByText('Yours')).toBeVisible()
  await card.getByRole('link', { name: `Start ${exercise.title}` }).click()
  await expect(page).toHaveURL(new RegExp(`/app/exercises/${created.result.structuredContent.exercise?.id}$`))
  await expect(page.getByRole('button', { name: `Play ${exercise.title}` })).toBeVisible()
})

test('the MCP server turns away a caller with no token and says where to get one', async ({ request, baseURL }) => {
  const response = await request.post('/mcp', { data: { jsonrpc: '2.0', id: 1, method: 'tools/list' } })
  expect(response.status()).toBe(401)
  expect(response.headers()['www-authenticate']).toBe(`Bearer resource_metadata="${baseURL}/.well-known/oauth-protected-resource/mcp"`)

  const metadata = await request.get('/.well-known/oauth-protected-resource/mcp')
  expect(metadata.ok()).toBe(true)
  expect(await metadata.json()).toMatchObject({ resource: `${baseURL}/mcp`, bearer_methods_supported: ['header'] })
})
