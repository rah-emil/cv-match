import { describe, expect, it } from 'vitest'
import {
  DEFAULT_COVER_LETTER_PROMPT,
  DEFAULT_CV_ANALYSIS_PROMPT,
  DEFAULT_MATCH_ASSESSMENT_PROMPT,
  DEFAULT_MAX_OUTPUT_TOKENS,
  DEFAULT_SETTINGS,
  DEFAULT_SYSTEM_PROMPT,
  MAX_OUTPUT_TOKENS_HINT,
  PRESET_MODELS,
  type ExtensionSettings,
} from './settings'

describe('DEFAULT_SETTINGS', () => {
  it('has expected default API URL and model', () => {
    expect(DEFAULT_SETTINGS.openAiApiUrl).toBe('https://api.openai.com/v1')
    expect(DEFAULT_SETTINGS.model).toBe('gpt-4o')
    expect(DEFAULT_SETTINGS.themeMode).toBe('auto')
  })

  it('contains all required string fields', () => {
    const keys: (keyof ExtensionSettings)[] = [
      'openAiApiKey',
      'coverLetter',
      'openAiApiUrl',
      'model',
      'cvFilePath',
      'cvContent',
      'themeMode',
      'systemPrompt',
      'matchAssessmentPrompt',
      'coverLetterPrompt',
      'avatarFilePath',
      'avatarDataUrl',
      'firstName',
      'lastName',
      'email',
      'phone',
      'linkedIn',
      'telegram',
      'website',
    ]

    for (const key of keys) {
      expect(typeof DEFAULT_SETTINGS[key]).toBe('string')
    }
  })

  it('defaults max output tokens to 4096', () => {
    expect(DEFAULT_SETTINGS.maxOutputTokens).toBe(DEFAULT_MAX_OUTPUT_TOKENS)
    expect(DEFAULT_MAX_OUTPUT_TOKENS).toBe(4096)
  })

  it('has a helpful max tokens hint message', () => {
    expect(MAX_OUTPUT_TOKENS_HINT).toContain('4096')
    expect(MAX_OUTPUT_TOKENS_HINT).toContain('8192')
  })

  it('starts with empty user-provided values', () => {
    expect(DEFAULT_SETTINGS.openAiApiKey).toBe('')
    expect(DEFAULT_SETTINGS.coverLetter).toBe('')
    expect(DEFAULT_SETTINGS.cvFilePath).toBe('')
    expect(DEFAULT_SETTINGS.cvContent).toBe('')
  })

  it('defaults match evaluation model to gpt-4o-mini', () => {
    expect(DEFAULT_SETTINGS.matchAssessmentModel).toBe('gpt-4o-mini-2024-07-18')
  })

  it('has a default cover letter prompt', () => {
    expect(DEFAULT_SETTINGS.coverLetterPrompt).toBe(DEFAULT_COVER_LETTER_PROMPT)
    expect(DEFAULT_COVER_LETTER_PROMPT).toContain('150–220 words')
  })

  it('has a non-empty CV generation prompt by default', () => {
    expect(DEFAULT_SETTINGS.systemPrompt).toBe(DEFAULT_SYSTEM_PROMPT)
    expect(DEFAULT_SETTINGS.systemPrompt.length).toBeGreaterThan(100)
    expect(DEFAULT_SYSTEM_PROMPT).toContain('Do not generate a cover letter')
  })

  it('has a non-empty match assessment prompt by default', () => {
    expect(DEFAULT_SETTINGS.matchAssessmentPrompt).toBe(
      DEFAULT_MATCH_ASSESSMENT_PROMPT,
    )
    expect(DEFAULT_MATCH_ASSESSMENT_PROMPT).toContain('Overall Match Score')
  })
})

describe('PRESET_MODELS', () => {
  it('includes expected model names', () => {
    expect(PRESET_MODELS).toContain('gpt-5.5')
    expect(PRESET_MODELS).toContain('gpt-5.4')
    expect(PRESET_MODELS).toContain('gpt-4o-mini-2024-07-18')
  })
})

describe('DEFAULT_CV_ANALYSIS_PROMPT', () => {
  it('requires a dated career timeline in cvContext', () => {
    expect(DEFAULT_CV_ANALYSIS_PROMPT).toContain('Career timeline')
    expect(DEFAULT_CV_ANALYSIS_PROMPT).toContain('start date')
    expect(DEFAULT_CV_ANALYSIS_PROMPT).toContain('reverse chronological order')
  })
})
