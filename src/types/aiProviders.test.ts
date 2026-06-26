import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from './settings'
import {
  applyProviderChange,
  getApiBaseUrl,
  getPresetModels,
  syncProviderApiUrl,
} from './aiProviders'

describe('aiProviders', () => {
  it('exposes different model lists per provider', () => {
    expect(getPresetModels('openai')).toContain('gpt-4o')
    expect(getPresetModels('anthropic')).toContain('claude-sonnet-4-20250514')
    expect(getPresetModels('openai')).not.toContain('claude-sonnet-4-20250514')
  })

  it('sets the API base URL from the selected provider', () => {
    expect(getApiBaseUrl('openai')).toBe('https://api.openai.com/v1')
    expect(getApiBaseUrl('anthropic')).toBe('https://api.anthropic.com/v1')
  })

  it('resets models when switching to a provider that does not support them', () => {
    const next = applyProviderChange(
      {
        ...DEFAULT_SETTINGS,
        model: 'gpt-4o',
        matchAssessmentModel: 'gpt-5.4-mini',
      },
      'anthropic',
    )

    expect(next.aiProvider).toBe('anthropic')
    expect(next.openAiApiUrl).toBe('https://api.anthropic.com/v1')
    expect(next.model).toBe('claude-sonnet-4-20250514')
    expect(next.matchAssessmentModel).toBe('claude-3-7-sonnet-20250219')
  })

  it('keeps custom models when they exist in the provider preset list', () => {
    const next = applyProviderChange(
      {
        ...DEFAULT_SETTINGS,
        model: 'claude-opus-4-20250514',
        matchAssessmentModel: 'claude-3-5-haiku-20241022',
      },
      'anthropic',
    )

    expect(next.model).toBe('claude-opus-4-20250514')
    expect(next.matchAssessmentModel).toBe('claude-3-5-haiku-20241022')
  })

  it('syncs stored settings to the provider endpoint on load', () => {
    const synced = syncProviderApiUrl({
      ...DEFAULT_SETTINGS,
      aiProvider: 'anthropic',
      openAiApiUrl: 'https://api.openai.com/v1',
    })

    expect(synced.openAiApiUrl).toBe('https://api.anthropic.com/v1')
  })
})
