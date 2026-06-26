import { describe, expect, it } from 'vitest'
import { computeCoverSourceRect } from './avatarCoverImage'

describe('computeCoverSourceRect', () => {
  it('crops the sides of a wide image', () => {
    const crop = computeCoverSourceRect(1600, 900, 100, 100)

    expect(crop.sy).toBe(0)
    expect(crop.sh).toBe(900)
    expect(crop.sw).toBe(900)
    expect(crop.sx).toBe(350)
  })

  it('crops the top and bottom of a tall image', () => {
    const crop = computeCoverSourceRect(900, 1600, 100, 100)

    expect(crop.sx).toBe(0)
    expect(crop.sw).toBe(900)
    expect(crop.sh).toBe(900)
    expect(crop.sy).toBe(350)
  })

  it('uses the full image when aspect ratios match', () => {
    const crop = computeCoverSourceRect(800, 800, 100, 100)

    expect(crop).toEqual({ sx: 0, sy: 0, sw: 800, sh: 800 })
  })
})
