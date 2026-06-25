<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  SettingOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import MainPanel from './components/MainPanel.vue'
import ProfilePanel from './components/ProfilePanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import { useSettings } from './composables/useSettings'
import { useTheme } from './composables/useTheme'
import type { ExtensionSettings } from './types/settings'

const activeTab = ref('main')
const { settings, loading, saving, persist } = useSettings()
const { isDark, antTheme } = useTheme(computed(() => settings.value.themeMode))

watch(
  isDark,
  (dark) => {
    document.body.classList.toggle('popup--dark', dark)
    document.body.classList.toggle('popup--light', !dark)
  },
  { immediate: true },
)

async function handleSave(nextSettings: ExtensionSettings, silent = false) {
  await persist(nextSettings, silent)
}
</script>

<template>
  <a-config-provider :theme="antTheme">
    <div class="popup" :class="isDark ? 'popup--dark' : 'popup--light'">
      <header class="popup__header">
        <img src="/logo.png" alt="AI Match" class="popup__logo" />
      </header>

      <a-spin :spinning="loading">
        <a-tabs v-model:active-key="activeTab" class="popup__tabs">
          <a-tab-pane key="main">
            <template #tab>
              <span class="popup__tab-label">
                <ThunderboltOutlined />
                Home
              </span>
            </template>
            <MainPanel :settings="settings" />
          </a-tab-pane>

          <a-tab-pane key="profile">
            <template #tab>
              <span class="popup__tab-label">
                <UserOutlined />
                Profile
              </span>
            </template>
            <ProfilePanel
              :settings="settings"
              :saving="saving"
              @save="handleSave"
            />
          </a-tab-pane>

          <a-tab-pane key="settings">
            <template #tab>
              <span class="popup__tab-label">
                <SettingOutlined />
                Settings
              </span>
            </template>
            <SettingsPanel
              :settings="settings"
              :saving="saving"
              @save="handleSave"
            />
          </a-tab-pane>
        </a-tabs>
      </a-spin>
    </div>
  </a-config-provider>
</template>

<style scoped>
.popup {
  width: 380px;
  min-height: 420px;
  padding: 16px;
  box-sizing: border-box;
  background: var(--popup-bg);
  transition: background 0.25s ease;
}

.popup__header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 0 12px;
}

.popup__logo {
  height: 44px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}

.popup__tabs :deep(.ant-tabs-nav) {
  margin-bottom: 12px;
}

.popup__tabs :deep(.ant-tabs-tab) {
  padding: 6px 0;
}

.popup__tab-label {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.popup__tab-label :deep(.anticon) {
  font-size: 13px;
}
</style>
