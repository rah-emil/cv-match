import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  type ExtensionSettings,
} from '../types/settings'

function getLocalStorage() {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    throw new Error(
      'Chrome storage is unavailable. Open the popup from the installed extension.',
    )
  }

  return chrome.storage.local
}

function mergeWithDefaults(
  stored: Partial<ExtensionSettings> | undefined,
): ExtensionSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
  }
}

export async function loadSettings(): Promise<ExtensionSettings> {
  const result = await getLocalStorage().get(SETTINGS_STORAGE_KEY)
  const stored = result[SETTINGS_STORAGE_KEY] as
    | Partial<ExtensionSettings>
    | undefined
  return mergeWithDefaults(stored)
}

export async function saveSettings(
  settings: ExtensionSettings,
): Promise<void> {
  await getLocalStorage().set({ [SETTINGS_STORAGE_KEY]: settings })
}
