import { onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { DEFAULT_SETTINGS, type ExtensionSettings } from '../types/settings'
import { loadSettings, saveSettings } from '../storage/settingsStorage'

export function useSettings() {
  const settings = ref<ExtensionSettings>({ ...DEFAULT_SETTINGS })
  const loading = ref(true)
  const saving = ref(false)

  async function refresh() {
    loading.value = true
    try {
      settings.value = await loadSettings()
    } catch {
      message.error('Failed to load settings')
    } finally {
      loading.value = false
    }
  }

  async function persist(nextSettings: ExtensionSettings, silent = false) {
    saving.value = true
    try {
      await saveSettings(nextSettings)
      settings.value = nextSettings
      if (!silent) {
        message.success('Settings saved')
      }
    } catch {
      message.error('Failed to save settings')
    } finally {
      saving.value = false
    }
  }

  onMounted(refresh)

  return {
    settings,
    loading,
    saving,
    refresh,
    persist,
  }
}
