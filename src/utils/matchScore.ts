export type MatchScoreBand = 'excellent' | 'strong' | 'partial' | 'weak' | 'poor'

export interface MatchScorePresentation {
  score: number
  label: string
  band: MatchScoreBand
}

export function parseMatchScore(text: string): number | null {
  const patterns = [
    /overall\s+match\s+score\s*:\s*(\d+(?:\.\d+)?)\s*(?:\/\s*10)?/i,
    /match\s+score\s*:\s*(\d+(?:\.\d+)?)\s*(?:\/\s*10)?/i,
    /(\d+(?:\.\d+)?)\s*\/\s*10/,
    /(\d+(?:\.\d+)?)\s+out\s+of\s+10/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (!match) continue

    const score = Number.parseFloat(match[1])
    if (!Number.isNaN(score) && score >= 0 && score <= 10) {
      return score
    }
  }

  return null
}

function scoreBand(score: number): MatchScoreBand {
  if (score >= 9) return 'excellent'
  if (score >= 7) return 'strong'
  if (score >= 5) return 'partial'
  if (score >= 3) return 'weak'
  return 'poor'
}

function scoreLabel(band: MatchScoreBand): string {
  switch (band) {
    case 'excellent':
      return 'Great fit'
    case 'strong':
      return 'Good fit'
    case 'partial':
      return 'Maybe'
    case 'weak':
      return 'Weak fit'
    case 'poor':
      return 'Not a fit'
  }
}

export function getMatchScorePresentation(score: number): MatchScorePresentation {
  const clamped = Math.max(0, Math.min(10, score))
  const band = scoreBand(clamped)

  return {
    score: clamped,
    label: scoreLabel(band),
    band,
  }
}

/** Remove the score line from assessment body — already shown in the score card. */
export function stripScoreLine(text: string): string {
  return text
    .replace(/^\s*overall\s+match\s+score\s*:\s*\d+(?:\.\d+)?\s*(?:\/\s*10)?\s*\n?/i, '')
    .trim()
}
