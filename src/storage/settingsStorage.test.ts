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
      openAiApiKey: 'sk-roundtrip',
      coverLetter: 'Hello hiring manager',
      openAiApiUrl: 'https://custom.api/v1',
      model: 'gpt-4o-mini',
      cvFilePath: '/Users/me/cv.pdf',
      themeMode: 'dark',
      systemPrompt: 'Custom prompt text',
    }

    await saveSettings(nextSettings)
    const loaded = await loadSettings()

    expect(loaded).toEqual(nextSettings)
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      [SETTINGS_STORAGE_KEY]: nextSettings,
    })
  })
})
