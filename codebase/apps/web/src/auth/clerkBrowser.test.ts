import { describe, expect, it } from 'vitest'
import { APP_HOME, authErrorMessage, readAuthSettings, safeRedirectPath } from './clerkBrowser'

const ORIGIN = 'https://count-in.ai'

describe('safeRedirectPath', () => {
  it('goes to the app when nothing was asked for', () => {
    expect(safeRedirectPath('', ORIGIN)).toBe(APP_HOME)
  })

  it('keeps a path on this site, with its query', () => {
    expect(safeRedirectPath('?redirect_url=%2Fapp%2Fexercises%3Farea%3Dscales', ORIGIN)).toBe('/app/exercises?area=scales')
    expect(safeRedirectPath(`?redirect_url=${encodeURIComponent(`${ORIGIN}/app/history`)}`, ORIGIN)).toBe('/app/history')
  })

  it('refuses to leave the site', () => {
    for (const wanted of ['https://evil.example/app', '//evil.example/app', 'javascript:alert(1)', 'https://count-in.ai.evil.example/']) {
      expect(safeRedirectPath(`?redirect_url=${encodeURIComponent(wanted)}`, ORIGIN)).toBe(APP_HOME)
    }
  })
})

describe('authErrorMessage', () => {
  it('puts the common Clerk errors in plain words', () => {
    expect(authErrorMessage({ errors: [{ code: 'form_password_incorrect', message: 'Password is incorrect.' }] })).toMatch(/not right/)
  })

  it('falls back to what Clerk said, longest first, then to the error itself', () => {
    expect(authErrorMessage({ errors: [{ code: 'something_new', message: 'Short.', longMessage: 'The long explanation.' }] })).toBe('The long explanation.')
    expect(authErrorMessage(new Error('Offline'))).toBe('Offline')
    expect(authErrorMessage(null)).toMatch(/went wrong/)
  })
})

describe('readAuthSettings', () => {
  it('assumes email and password when the instance tells it nothing', () => {
    expect(readAuthSettings(undefined)).toMatchObject({ passwordEnabled: true, passwordRequired: true, social: [], signUpMode: 'public' })
  })

  it('reads what is switched on: passwordless, required names, social providers, invitation-only sign-up', () => {
    const settings = readAuthSettings({
      userSettings: {
        attributes: { password: { enabled: false }, first_name: { enabled: true, required: true } },
        social: { oauth_google: { enabled: true, strategy: 'oauth_google' }, oauth_github: { enabled: false, strategy: 'oauth_github' } },
        signUp: { mode: 'restricted' },
      },
    })
    expect(settings).toMatchObject({ passwordEnabled: false, nameRequired: true, signUpMode: 'restricted' })
    expect(settings.social).toEqual([{ strategy: 'oauth_google', name: 'Google' }])
  })
})
