import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  DEFAULT_SYSTEM_PROMPT,
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
      'themeMode',
      'systemPrompt',
    ]

    for (const key of keys) {
      expect(typeof DEFAULT_SETTINGS[key]).toBe('string')
    }
  })

  it('starts with empty user-provided values', () => {
    expect(DEFAULT_SETTINGS.openAiApiKey).toBe('')
    expect(DEFAULT_SETTINGS.coverLetter).toBe('')
    expect(DEFAULT_SETTINGS.cvFilePath).toBe('')
  })

  it('has a non-empty system prompt by default', () => {
    expect(DEFAULT_SETTINGS.systemPrompt).toBe(DEFAULT_SYSTEM_PROMPT)
    expect(DEFAULT_SETTINGS.systemPrompt.length).toBeGreaterThan(100)
  })
})

describe('PRESET_MODELS', () => {
  it('includes expected model names', () => {
    expect(PRESET_MODELS).toContain('gpt-5.5')
    expect(PRESET_MODELS).toContain('gpt-5.4')
    expect(PRESET_MODELS).toContain('gpt-4o-mini-2024-07-18')
  })
})
