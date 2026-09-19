import { describe, expect, it } from 'vitest'
import { LONGEST_BIO, LONGEST_LOG_ENTRY } from '../../appData/player'
import { createMemoryPlayerRepository } from '../../test/memoryPlayer'
import { appendLog, listLog, readBio, writeBio } from './player'

/**
 * The teacher's memory, held to its rules at the one place both doors come
 * through. What matters here is that the bio is a *reduction* — replaced whole,
 * never appended to — and that the log is append-only, since a record of a
 * conversation that can be rewritten afterwards is not a record.
 */

function stores() {
  return { player: createMemoryPlayerRepository() }
}

describe('the player bio', () => {
  it('is nothing at all for a player who has never had a lesson', async () => {
    await expect(readBio(stores(), 'user_123')).resolves.toEqual({ status: 'ok', bio: null })
  })

  it('is replaced whole rather than added to', async () => {
    const memory = stores()
    await writeBio(memory, 'user_123', 'Plays rock. Wants to learn jazz.')
    await writeBio(memory, 'user_123', 'Plays rock and some jazz now. Bored by scales.')

    const read = await readBio(memory, 'user_123')
    expect(read).toMatchObject({ status: 'ok' })
    expect(read.status === 'ok' && read.bio?.bio).toBe('Plays rock and some jazz now. Bored by scales.')
  })

  it('is cleared by writing nothing, the way clearing a note is', async () => {
    const memory = stores()
    await writeBio(memory, 'user_123', 'Something')
    await expect(writeBio(memory, 'user_123', '   ')).resolves.toEqual({ status: 'ok', bio: null })
    await expect(readBio(memory, 'user_123')).resolves.toEqual({ status: 'ok', bio: null })
  })

  it('keeps one player’s bio from another', async () => {
    const memory = stores()
    await writeBio(memory, 'user_123', 'Mine')
    await writeBio(memory, 'user_456', 'Theirs')

    const mine = await readBio(memory, 'user_123')
    expect(mine.status === 'ok' && mine.bio?.bio).toBe('Mine')
  })

  it('refuses a bio longer than a reduction has any business being', async () => {
    const answer = await writeBio(stores(), 'user_123', 'x'.repeat(LONGEST_BIO + 1))
    expect(answer).toMatchObject({ status: 'invalid' })
  })

  it('says so when there is no memory store, rather than pretending it saved', async () => {
    await expect(writeBio({ player: null }, 'user_123', 'x')).resolves.toEqual({ status: 'unconfigured' })
    await expect(readBio({ player: null }, 'user_123')).resolves.toEqual({ status: 'unconfigured' })
  })
})

describe('the player log', () => {
  it('is append-only, newest first', async () => {
    const memory = stores()
    await appendLog(memory, 'user_123', { kind: 'onboarding', summary: 'First lesson: wants jazz standards.' })
    await appendLog(memory, 'user_123', { kind: 'check_in', summary: 'Two weeks in; added comping.' })

    const listed = await listLog(memory, 'user_123')
    expect(listed.status).toBe('ok')
    expect(listed.status === 'ok' && listed.entries.map((entry) => entry.kind)).toEqual(['check_in', 'onboarding'])
  })

  it('refuses an entry that says nothing, and a kind that is not one of the four', async () => {
    const memory = stores()
    await expect(appendLog(memory, 'user_123', { kind: 'check_in', summary: '   ' })).resolves.toMatchObject({
      status: 'invalid',
    })
    await expect(
      appendLog(memory, 'user_123', { kind: 'whenever', summary: 'Something happened' }),
    ).resolves.toMatchObject({ status: 'invalid' })
    await expect(
      appendLog(memory, 'user_123', { kind: 'check_in', summary: 'x'.repeat(LONGEST_LOG_ENTRY + 1) }),
    ).resolves.toMatchObject({ status: 'invalid' })
  })

  it('keeps one player’s log from another', async () => {
    const memory = stores()
    await appendLog(memory, 'user_123', { kind: 'on_demand', summary: 'Mine' })
    await appendLog(memory, 'user_456', { kind: 'on_demand', summary: 'Theirs' })

    const listed = await listLog(memory, 'user_123')
    expect(listed.status === 'ok' && listed.entries.map((entry) => entry.summary)).toEqual(['Mine'])
  })

  it('takes a limit, for a lesson that only wants the last few', async () => {
    const memory = stores()
    for (const summary of ['one', 'two', 'three']) {
      await appendLog(memory, 'user_123', { kind: 'after_session', summary })
    }
    const listed = await listLog(memory, 'user_123', 2)
    expect(listed.status === 'ok' && listed.entries).toHaveLength(2)
  })
})
