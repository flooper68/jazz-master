import { describe, expect, it } from 'vitest'
import { sanitizeErrorShape } from './init'

const devShape = {
  message: 'boom',
  code: -32600,
  data: {
    code: 'BAD_REQUEST',
    httpStatus: 400,
    path: 'health',
    stack: 'Error: boom\n    at /Users/someone/dev/jazz-master/…',
  },
}

describe('sanitizeErrorShape', () => {
  it('drops the stack from error shapes outside dev', () => {
    const shape = sanitizeErrorShape(devShape, false)

    expect(shape.data).not.toHaveProperty('stack')
    expect(shape.data).toMatchObject({
      code: 'BAD_REQUEST',
      httpStatus: 400,
      path: 'health',
    })
    expect(shape.message).toBe('boom')
  })

  it('keeps the full shape, stack included, in dev', () => {
    expect(sanitizeErrorShape(devShape, true)).toBe(devShape)
  })
})
