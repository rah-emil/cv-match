import { beforeEach, describe, expect, it } from 'vitest'
import { storageData } from '../test/setup'
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  type ExtensionSettings,
} from '../types/settings'
import { loadSettings, saveSettings } from './settingsStorage'

describe('settingsStorage', () => {
  beforeEach(() => {
    delete storageData[SETTINGS_STORAGE_KEY]
  })

  it('returns defaults when storage is empty', async () => {
    const settings = await loadSettings()
    expect(settings).toEqual(DEFAULT_SETTINGS)
  })

  it('merges partial stored values with defaults', async () => {
    storageData[SETTINGS_STORAGE_KEY] = {
      openAiApiKey: 'sk-test',
      model: 'gpt-4.1',
    }

    const settings = await loadSettings()

    expect(settings).toEqual({
      ...DEFAULT_SETTINGS,
      openAiApiKey: 'sk-test',
      model: 'gpt-4.1',
    })
  })

  it('persists and loads all settings fields', async () => {
    const nextSettings: ExtensionSettings = {
      aiProvider: 'openai',
      openAiApiKey: 'sk-roundtrip',
      coverLetter: 'Hello hiring manager',
      openAiApiUrl: 'https://custom.api/v1',
      model: 'gpt-4o-mini',
      matchAssessmentModel: 'gpt-5-nano-2025-08-07',
      cvFilePath: '/Users/me/cv.pdf',
      cvContent: 'Full extracted CV text here',
      cvContext: 'Distilled CV context',
      cvNotes: 'Missing quantified results',
      themeMode: 'dark',
      systemPrompt: 'Custom prompt text',
      matchAssessmentPrompt: 'Custom match prompt',
      coverLetterPrompt: 'Custom cover letter prompt',
      maxOutputTokens: 8192,
      avatarFilePath: 'avatar.png',
      avatarDataUrl: 'data:image/png;base64,abc',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '+1 555',
      linkedIn: 'https://linkedin.com/in/jane',
      telegram: '@jane',
      website: 'https://jane.dev',
    }

    await saveSettings(nextSettings)
    const loaded = await loadSettings()

    expect(loaded).toEqual({
      ...nextSettings,
      cvContent: '',
      openAiApiUrl: 'https://api.openai.com/v1',
    })
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      [SETTINGS_STORAGE_KEY]: nextSettings,
    })
  })

  it('syncs API URL from the selected provider on load', async () => {
    storageData[SETTINGS_STORAGE_KEY] = {
      aiProvider: 'anthropic',
      openAiApiUrl: 'https://api.openai.com/v1',
    }

    const settings = await loadSettings()

    expect(settings.aiProvider).toBe('anthropic')
    expect(settings.openAiApiUrl).toBe('https://api.anthropic.com/v1')
  })
})
