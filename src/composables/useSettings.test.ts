import { defineComponent, nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { storageData } from '../test/setup'
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  type ExtensionSettings,
} from '../types/settings'
import { useSettings } from './useSettings'

const messageSuccess = vi.fn()
const messageError = vi.fn()

vi.mock('ant-design-vue', () => ({
  message: {
    success: (...args: unknown[]) => messageSuccess(...args),
    error: (...args: unknown[]) => messageError(...args),
  },
}))

function mountUseSettings() {
  let composable!: ReturnType<typeof useSettings>

  const Wrapper = defineComponent({
    setup() {
      composable = useSettings()
      return () => null
    },
  })

  mount(Wrapper)
  return composable
}

describe('useSettings', () => {
  beforeEach(() => {
    delete storageData[SETTINGS_STORAGE_KEY]
    messageSuccess.mockClear()
    messageError.mockClear()
  })

  it('loads settings on mount and stops loading', async () => {
    storageData[SETTINGS_STORAGE_KEY] = {
      openAiApiKey: 'sk-loaded',
    }

    const { settings, loading } = mountUseSettings()

    await flushPromises()
    await nextTick()

    expect(loading.value).toBe(false)
    expect(settings.value.openAiApiKey).toBe('sk-loaded')
    expect(settings.value.model).toBe(DEFAULT_SETTINGS.model)
  })

  it('persists settings and shows success message', async () => {
    const { settings, saving, persist } = mountUseSettings()
    await flushPromises()

    const nextSettings: ExtensionSettings = {
      ...DEFAULT_SETTINGS,
      openAiApiKey: 'sk-save',
      coverLetter: 'Cover text',
    }

    await persist(nextSettings)
    await nextTick()

    expect(saving.value).toBe(false)
    expect(settings.value).toEqual(nextSettings)
    expect(storageData[SETTINGS_STORAGE_KEY]).toEqual(nextSettings)
    expect(messageSuccess).toHaveBeenCalledWith('Settings saved')
  })
})
