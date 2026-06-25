import { describe, expect, it } from 'vitest'
import {
  getMatchScorePresentation,
  parseMatchScore,
  stripScoreLine,
} from './matchScore'

describe('parseMatchScore', () => {
  it('parses Overall Match Score line', () => {
    expect(
      parseMatchScore('Overall Match Score: 7.5/10\n\nSome text'),
    ).toBe(7.5)
  })

  it('parses X/10 format', () => {
    expect(parseMatchScore('Your rating is 8/10 for this role')).toBe(8)
  })

  it('returns null when no score found', () => {
    expect(parseMatchScore('No score here')).toBeNull()
  })

  it('rejects scores outside 0-10', () => {
    expect(parseMatchScore('Overall Match Score: 11/10')).toBeNull()
  })
})

describe('stripScoreLine', () => {
  it('removes the score line from the start', () => {
    expect(stripScoreLine('Overall Match Score: 4/10\n\n## Verdict\nApply.')).toBe(
      '## Verdict\nApply.',
    )
  })
})

describe('getMatchScorePresentation', () => {
  it('returns great fit for high scores', () => {
    const result = getMatchScorePresentation(9.2)
    expect(result.label).toBe('Great fit')
    expect(result.band).toBe('excellent')
    expect(result.score).toBe(9.2)
  })

  it('returns not a fit for low scores', () => {
    const result = getMatchScorePresentation(2)
    expect(result.label).toBe('Not a fit')
    expect(result.band).toBe('poor')
  })

  it('clamps out-of-range values', () => {
    expect(getMatchScorePresentation(12).score).toBe(10)
    expect(getMatchScorePresentation(-1).score).toBe(0)
  })
})
