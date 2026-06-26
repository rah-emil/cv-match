import { describe, expect, it } from 'vitest'
import {
  extractJobTextAutomatically,
  extractTextFromElement,
  truncateJobText,
} from './jobTextExtraction'

describe('jobTextExtraction', () => {
  it('truncates very long text', () => {
    const text = 'a'.repeat(12050)

    expect(truncateJobText(text)).toBe(`${'a'.repeat(12000)}\n...[truncated]`)
  })

  it('extracts trimmed text from an element', () => {
    const element = document.createElement('div')
    element.textContent = '  Senior Engineer role  '

    expect(extractTextFromElement(element)).toBe('Senior Engineer role')
  })

  it('falls back to body text when no job selectors match', () => {
    document.body.innerHTML = '<main>Backend developer with Node.js experience</main>'

    expect(extractJobTextAutomatically()).toContain('Backend developer')
  })
})
