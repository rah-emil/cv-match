<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import {
  LinkOutlined,
  LockOutlined,
  SaveOutlined,
  UnlockOutlined,
  WarningOutlined,
} from '@ant-design/icons-vue'
import ThemePicker from './ThemePicker.vue'
import {
  DEFAULT_SYSTEM_PROMPT,
  PRESET_MODELS,
  type ExtensionSettings,
  type ThemeMode,
} from '../types/settings'

const props = defineProps<{
  settings: ExtensionSettings
  saving: boolean
}>()

const emit = defineEmits<{
  save: [settings: ExtensionSettings, silent?: boolean]
}>()

const form = reactive<ExtensionSettings>({ ...props.settings })
const promptEditing = ref(false)

const modelOptions = PRESET_MODELS.map((m) => ({ value: m, label: m }))

watch(
  () => props.settings,
  (next) => {
    Object.assign(form, next)
  },
  { deep: true },
)

function handleSubmit() {
  emit('save', { ...form })
}

function handleThemeChange(mode: ThemeMode) {
  form.themeMode = mode
  emit('save', { ...form }, true)
}

function togglePromptEditing(val: boolean) {
  promptEditing.value = val
  if (!val) {
    // reset to saved value when locking
    form.systemPrompt = props.settings.systemPrompt
  }
}

function resetPrompt() {
  form.systemPrompt = DEFAULT_SYSTEM_PROMPT
}
</script>

<template>
  <a-form
    :model="form"
    layout="vertical"
    class="settings-panel"
    @finish="handleSubmit"
  >
    <!-- Appearance -->
    <div class="settings-panel__group">
      <div class="settings-panel__label">Appearance</div>
      <p class="settings-panel__hint">
        Choose how the extension looks. System follows your OS theme.
      </p>
      <ThemePicker v-model:value="form.themeMode" @change="handleThemeChange" />
    </div>

    <a-divider class="settings-panel__divider" />

    <!-- OpenAI connection -->
    <div class="settings-panel__group">
      <div class="settings-panel__label-row">
        <span class="settings-panel__label">OpenAI connection</span>
        <a
          href="https://platform.openai.com/"
          target="_blank"
          rel="noopener noreferrer"
          class="settings-panel__get-token"
        >
          <LinkOutlined />
          Get token
        </a>
      </div>
      <p class="settings-panel__hint">
        API credentials and model used to generate your CV.
      </p>

      <a-form-item label="OpenAI API key" name="openAiApiKey">
        <a-input-password
          v-model:value="form.openAiApiKey"
          placeholder="sk-..."
          autocomplete="off"
        />
      </a-form-item>

      <a-form-item label="OpenAI API URL" name="openAiApiUrl">
        <a-input
          v-model:value="form.openAiApiUrl"
          placeholder="https://api.openai.com/v1"
        />
      </a-form-item>

      <a-form-item label="Model" name="model">
        <a-select
          v-model:value="form.model"
          mode="combobox"
          :options="modelOptions"
          placeholder="gpt-4o"
          :filter-option="
            (input: string, option: { value: string } | undefined) =>
              option?.value?.toLowerCase().includes(input.toLowerCase()) ?? false
          "
          allow-clear
        />
      </a-form-item>
    </div>

    <a-divider class="settings-panel__divider" />

    <!-- System prompt -->
    <div class="settings-panel__group">
      <div class="settings-panel__label-row">
        <span class="settings-panel__label">System prompt</span>
        <div class="settings-panel__prompt-controls">
          <a-tooltip
            v-if="!promptEditing"
            title="Unlock to edit the system prompt"
          >
            <a-switch
              :checked="promptEditing"
              size="small"
              :checked-children="null"
              :un-checked-children="null"
              @change="togglePromptEditing"
            >
              <template #checkedChildren>
                <UnlockOutlined />
              </template>
              <template #unCheckedChildren>
                <LockOutlined />
              </template>
            </a-switch>
          </a-tooltip>
          <a-switch
            v-else
            :checked="promptEditing"
            size="small"
            @change="togglePromptEditing"
          >
            <template #checkedChildren>
              <UnlockOutlined />
            </template>
            <template #unCheckedChildren>
              <LockOutlined />
            </template>
          </a-switch>
        </div>
      </div>

      <a-alert
        v-if="promptEditing"
        type="warning"
        show-icon
        banner
        class="settings-panel__prompt-warning"
      >
        <template #icon>
          <WarningOutlined />
        </template>
        <template #message>
          Editing this prompt may affect the quality and accuracy of your
          tailored CV and cover letter. Keep it focused on real experience,
          relevant skills, and natural keyword matching with the job description.
        </template>
      </a-alert>

      <a-form-item name="systemPrompt" class="settings-panel__prompt-item">
        <a-textarea
          v-model:value="form.systemPrompt"
          :disabled="!promptEditing"
          :rows="10"
          class="settings-panel__prompt-textarea"
          :class="{ 'settings-panel__prompt-textarea--locked': !promptEditing }"
        />
      </a-form-item>

      <a-button
        v-if="promptEditing"
        size="small"
        class="settings-panel__reset-btn"
        @click="resetPrompt"
      >
        Reset to default
      </a-button>
    </div>

    <a-form-item class="settings-panel__submit">
      <a-button type="primary" html-type="submit" block :loading="saving">
        <template #icon>
          <SaveOutlined />
        </template>
        Save settings
      </a-button>
    </a-form-item>
  </a-form>
</template>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  padding-bottom: 4px;
}

.settings-panel__group {
  display: flex;
  flex-direction: column;
}

.settings-panel__label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.settings-panel__label {
  font-size: 14px;
  font-weight: 600;
  color: var(--panel-title, rgba(0, 0, 0, 0.88));
}

.settings-panel__get-token {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #2f54eb;
  text-decoration: none;
  transition: opacity 0.15s;
}

.settings-panel__get-token:hover {
  opacity: 0.75;
}

.settings-panel__prompt-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-panel__hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--panel-subtitle, rgba(0, 0, 0, 0.45));
  line-height: 1.5;
}

.settings-panel__divider {
  margin: 16px 0;
}

.settings-panel__prompt-warning {
  margin-bottom: 10px;
  border-radius: 8px;
  font-size: 12px;
}

.settings-panel__prompt-item {
  margin-bottom: 8px;
}

.settings-panel__prompt-textarea {
  font-size: 12px;
  line-height: 1.6;
  font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
  resize: vertical;
}

.settings-panel__prompt-textarea--locked {
  opacity: 0.65;
  cursor: default;
}

.settings-panel__reset-btn {
  align-self: flex-start;
  margin-bottom: 4px;
}

.settings-panel__submit {
  margin-bottom: 0;
  margin-top: 12px;
}
</style>
