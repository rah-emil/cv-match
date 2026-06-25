<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  LinkOutlined,
  LockOutlined,
  SaveOutlined,
  UnlockOutlined,
  WarningOutlined,
} from '@ant-design/icons-vue'
import ThemePicker from './ThemePicker.vue'
import {
  DEFAULT_MATCH_ASSESSMENT_PROMPT,
  DEFAULT_MAX_OUTPUT_TOKENS,
  DEFAULT_SYSTEM_PROMPT,
  MAX_OUTPUT_TOKENS_HINT,
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
const cvPromptEditing = ref(false)
const matchPromptEditing = ref(false)
const maxTokensChanged = ref(false)

const showMaxTokensHint = computed(
  () => maxTokensChanged.value || form.maxOutputTokens !== DEFAULT_MAX_OUTPUT_TOKENS,
)

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

function toggleCvPromptEditing(val: boolean) {
  cvPromptEditing.value = val
  if (!val) {
    form.systemPrompt = props.settings.systemPrompt
  }
}

function toggleMatchPromptEditing(val: boolean) {
  matchPromptEditing.value = val
  if (!val) {
    form.matchAssessmentPrompt = props.settings.matchAssessmentPrompt
  }
}

function resetCvPrompt() {
  form.systemPrompt = DEFAULT_SYSTEM_PROMPT
}

function resetMatchPrompt() {
  form.matchAssessmentPrompt = DEFAULT_MATCH_ASSESSMENT_PROMPT
}

function handleMaxTokensChange() {
  maxTokensChanged.value = true
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
        API credentials and models. Use a fast model for match evaluation, a
        stronger one for CV generation.
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

      <a-form-item label="CV generation model" name="model">
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

      <a-form-item label="Match evaluation model" name="matchAssessmentModel">
        <a-select
          v-model:value="form.matchAssessmentModel"
          mode="combobox"
          :options="modelOptions"
          placeholder="gpt-4o-mini-2024-07-18"
          :filter-option="
            (input: string, option: { value: string } | undefined) =>
              option?.value?.toLowerCase().includes(input.toLowerCase()) ?? false
          "
          allow-clear
        />
      </a-form-item>

      <a-form-item label="Max output tokens" name="maxOutputTokens">
        <a-input-number
          v-model:value="form.maxOutputTokens"
          :min="256"
          :max="32768"
          :step="256"
          style="width: 100%"
          @change="handleMaxTokensChange"
        />
      </a-form-item>

      <a-alert
        v-if="showMaxTokensHint"
        type="info"
        show-icon
        banner
        class="settings-panel__tokens-hint"
      >
        <template #message>{{ MAX_OUTPUT_TOKENS_HINT }}</template>
      </a-alert>
    </div>

    <a-divider class="settings-panel__divider" />

    <!-- CV generation prompt -->
    <div class="settings-panel__group">
      <div class="settings-panel__label-row">
        <span class="settings-panel__label">CV generation prompt</span>
        <div class="settings-panel__prompt-controls">
          <a-tooltip
            v-if="!cvPromptEditing"
            title="Unlock to edit the CV generation prompt"
          >
            <a-switch
              :checked="cvPromptEditing"
              size="small"
              :checked-children="null"
              :un-checked-children="null"
              @change="toggleCvPromptEditing"
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
            :checked="cvPromptEditing"
            size="small"
            @change="toggleCvPromptEditing"
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
        v-if="cvPromptEditing"
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
          tailored CV. Keep it focused on real experience, relevant skills, and
          natural keyword matching with the job description.
        </template>
      </a-alert>

      <a-form-item name="systemPrompt" class="settings-panel__prompt-item">
        <a-textarea
          v-model:value="form.systemPrompt"
          :disabled="!cvPromptEditing"
          :rows="10"
          class="settings-panel__prompt-textarea"
          :class="{ 'settings-panel__prompt-textarea--locked': !cvPromptEditing }"
        />
      </a-form-item>

      <a-button
        v-if="cvPromptEditing"
        size="small"
        class="settings-panel__reset-btn"
        @click="resetCvPrompt"
      >
        Reset to default
      </a-button>
    </div>

    <a-divider class="settings-panel__divider" />

    <!-- Match assessment prompt -->
    <div class="settings-panel__group">
      <div class="settings-panel__label-row">
        <span class="settings-panel__label">Match assessment prompt</span>
        <div class="settings-panel__prompt-controls">
          <a-tooltip
            v-if="!matchPromptEditing"
            title="Unlock to edit the match assessment prompt"
          >
            <a-switch
              :checked="matchPromptEditing"
              size="small"
              :checked-children="null"
              :un-checked-children="null"
              @change="toggleMatchPromptEditing"
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
            :checked="matchPromptEditing"
            size="small"
            @change="toggleMatchPromptEditing"
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
        v-if="matchPromptEditing"
        type="warning"
        show-icon
        banner
        class="settings-panel__prompt-warning"
      >
        <template #icon>
          <WarningOutlined />
        </template>
        <template #message>
          Editing this prompt may affect how honestly and consistently match
          scores are calculated. Keep the 0–10 scale and practical hiring focus.
        </template>
      </a-alert>

      <a-form-item name="matchAssessmentPrompt" class="settings-panel__prompt-item">
        <a-textarea
          v-model:value="form.matchAssessmentPrompt"
          :disabled="!matchPromptEditing"
          :rows="10"
          class="settings-panel__prompt-textarea"
          :class="{ 'settings-panel__prompt-textarea--locked': !matchPromptEditing }"
        />
      </a-form-item>

      <a-button
        v-if="matchPromptEditing"
        size="small"
        class="settings-panel__reset-btn"
        @click="resetMatchPrompt"
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

.settings-panel__tokens-hint {
  margin-bottom: 12px;
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
