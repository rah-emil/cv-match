<script setup lang="ts">
import { computed, h, reactive, ref, watch } from 'vue'
import {
  CheckCircleOutlined,
  DeleteOutlined,
  DownOutlined,
  FileTextOutlined,
  LoadingOutlined,
  UpOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { ExtensionSettings } from '../types/settings'
import { AVATAR_MAX_BYTES, readImageAsDataUrl } from '../services/avatarReader'
import { readCvFile } from '../services/cvReader'
import { analyzeCv, type CvProfile } from '../services/openai'
import { getMissingRequiredProfileFields } from '../utils/autoFillProfile'

const props = defineProps<{
  settings: ExtensionSettings
  saving: boolean
}>()

const AiSparkleIcon = () =>
  h(
    'svg',
    {
      viewBox: '0 0 24 24',
      width: '1em',
      height: '1em',
      fill: 'currentColor',
      'aria-hidden': 'true',
      focusable: 'false',
    },
    [
      h('path', {
        d: 'M10 3c.3 3.2 1.8 4.7 5 5-3.2.3-4.7 1.8-5 5-.3-3.2-1.8-4.7-5-5 3.2-.3 4.7-1.8 5-5z',
      }),
      h('path', {
        d: 'M18 13.5c.12 1.45.83 2.16 2.28 2.28-1.45.12-2.16.83-2.28 2.28-.12-1.45-.83-2.16-2.28-2.28 1.45-.12 2.16-.83 2.28-2.28z',
      }),
    ],
  )

const emit = defineEmits<{
  save: [settings: ExtensionSettings, silent?: boolean]
}>()

const form = reactive<ExtensionSettings>({ ...props.settings })
const fileInput = ref<HTMLInputElement | null>(null)
const avatarInput = ref<HTMLInputElement | null>(null)
const parsing = ref(false)
const analyzing = ref(false)
const avatarLoading = ref(false)
const dragOver = ref(false)
const contextExpanded = ref(false)

const hasCvContent = computed(() => form.cvContent.trim().length > 0)
const hasCvContext = computed(() => form.cvContext.trim().length > 0)
const hasAvatar = computed(() => Boolean(form.avatarDataUrl))
const cvPreview = computed(() => {
  if (!form.cvContent) return ''
  const lines = form.cvContent.split('\n').slice(0, 8)
  return lines.join('\n')
})

const profileRules = {
  firstName: [{ required: true, message: 'First name is required' }],
  lastName: [{ required: true, message: 'Last name is required' }],
  email: [
    { required: true, message: 'Email is required' },
    { type: 'email', message: 'Enter a valid email' },
  ],
}

watch(
  () => props.settings,
  (next) => {
    Object.assign(form, next)
  },
  { deep: true },
)

function handleSubmit() {
  const missing = getMissingRequiredProfileFields(form)
  if (missing.length > 0) {
    message.warning(`Fill required fields: ${missing.join(', ')}`)
    return
  }
  emit('save', { ...form })
}

function openFilePicker() {
  fileInput.value?.click()
}

function openAvatarPicker() {
  avatarInput.value?.click()
}

async function processFile(file: File) {
  parsing.value = true
  try {
    const result = await readCvFile(file)
    form.cvFilePath = result.fileName
    form.cvContent = result.text
    form.cvContext = ''
    form.cvNotes = ''
    emit('save', { ...form }, true)
    message.success(`CV loaded: ${result.fileName} (${result.text.length.toLocaleString()} chars)`)
  } catch (e) {
    message.error((e as Error).message)
    parsing.value = false
    return
  }
  parsing.value = false

  await analyzeUploadedCv()
}

async function analyzeUploadedCv() {
  if (!form.openAiApiKey.trim()) {
    message.warning('Add your OpenAI API key in Settings to build the AI CV context')
    return
  }

  analyzing.value = true
  try {
    const analysis = await analyzeCv({
      settings: { ...form },
      cvText: form.cvContent,
    })
    form.cvContext = analysis.cvContext
    form.cvNotes = analysis.notes
    const filledFields = applyExtractedProfile(analysis.profile)
    emit('save', { ...form }, true)

    if (filledFields > 0) {
      message.success(
        `CV analyzed — AI context ready, ${filledFields} profile field${filledFields === 1 ? '' : 's'} auto-filled`,
      )
    } else {
      message.success('CV analyzed — AI context ready')
    }
    contextExpanded.value = true
  } catch (e) {
    message.error(`CV analysis failed: ${(e as Error).message}`)
  } finally {
    analyzing.value = false
  }
}

/** Fills only empty profile fields from the CV so manual input is never lost. */
function applyExtractedProfile(profile: CvProfile): number {
  const fields: (keyof CvProfile)[] = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'linkedIn',
    'telegram',
    'website',
  ]

  let filled = 0
  for (const field of fields) {
    const value = profile[field]?.trim()
    if (value && !form[field].trim()) {
      form[field] = value
      filled += 1
    }
  }

  return filled
}

function dismissCvNotes() {
  form.cvNotes = ''
  emit('save', { ...form }, true)
}

function saveCvContext() {
  emit('save', { ...form }, true)
}

function toggleContextExpanded() {
  contextExpanded.value = !contextExpanded.value
}

async function processAvatar(file: File) {
  if (!file.type.startsWith('image/')) {
    message.error('Please upload an image file')
    return
  }
  if (file.size > AVATAR_MAX_BYTES) {
    message.error('Avatar must be under 2 MB')
    return
  }

  avatarLoading.value = true
  try {
    form.avatarFilePath = file.name
    form.avatarDataUrl = await readImageAsDataUrl(file)
    emit('save', { ...form }, true)
    message.success('Avatar saved')
  } catch (e) {
    message.error((e as Error).message)
  } finally {
    avatarLoading.value = false
  }
}

async function handleFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''
  await processFile(file)
}

async function handleAvatarSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''
  await processAvatar(file)
}

function handleDrop(event: DragEvent) {
  dragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  void processFile(file)
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  dragOver.value = true
}

function handleDragLeave() {
  dragOver.value = false
}

function clearCv() {
  form.cvFilePath = ''
  form.cvContent = ''
  form.cvContext = ''
  form.cvNotes = ''
  contextExpanded.value = false
  emit('save', { ...form }, true)
  message.info('CV removed')
}

function clearAvatar() {
  form.avatarFilePath = ''
  form.avatarDataUrl = ''
  emit('save', { ...form }, true)
  message.info('Avatar removed')
}
</script>

<template>
  <a-form
    :model="form"
    :rules="profileRules"
    layout="vertical"
    class="profile-panel"
    @finish="handleSubmit"
  >
    <div class="profile-panel__label">Your profile</div>
    <p class="profile-panel__hint">
      Upload your CV first — the AI distills it into reusable context. Contact
      details below are used for auto-fill on job forms.
    </p>

    <div class="profile-panel__section-title profile-panel__section-title--ai">
      <span>CV</span>
      <AiSparkleIcon class="profile-panel__ai-icon" />
    </div>
    <p class="profile-panel__hint profile-panel__hint--compact">
      On upload the extension reads your CV and asks the default model to build a
      concise, reusable context and auto-fill your profile below.
    </p>

    <div class="profile-panel__cv-stack">
      <a-form-item name="cvContent" class="profile-panel__cv-upload">
        <template #label>Upload</template>
        <div
          class="profile-panel__drop-zone"
          :class="{
            'profile-panel__drop-zone--active': dragOver,
            'profile-panel__drop-zone--loaded': hasCvContent,
          }"
          @click="!hasCvContent && !parsing && !analyzing && openFilePicker()"
          @drop.prevent="handleDrop"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
        >
          <template v-if="parsing">
            <LoadingOutlined class="profile-panel__drop-icon profile-panel__drop-icon--spin" />
            <span class="profile-panel__drop-text">Reading CV…</span>
          </template>

          <template v-else-if="analyzing && !hasCvContent">
            <LoadingOutlined class="profile-panel__drop-icon profile-panel__drop-icon--spin" />
            <span class="profile-panel__drop-text">Analyzing CV with AI…</span>
          </template>

          <template v-else-if="hasCvContent">
            <div class="profile-panel__cv-loaded">
              <div class="profile-panel__cv-loaded-header">
                <CheckCircleOutlined class="profile-panel__cv-ok-icon" />
                <span class="profile-panel__cv-filename">{{ form.cvFilePath }}</span>
                <a-tooltip title="Remove CV">
                  <a-button
                    type="text"
                    size="small"
                    danger
                    class="profile-panel__cv-delete"
                    :disabled="analyzing"
                    @click.stop="clearCv"
                  >
                    <template #icon><DeleteOutlined /></template>
                  </a-button>
                </a-tooltip>
              </div>

              <div
                v-if="analyzing"
                class="profile-panel__cv-status profile-panel__cv-status--busy"
              >
                <LoadingOutlined class="profile-panel__drop-icon--spin" />
                <span>Analyzing…</span>
              </div>
              <div
                v-else-if="hasCvContext"
                class="profile-panel__cv-status profile-panel__cv-status--ready"
              >
                <AiSparkleIcon class="profile-panel__ai-icon" />
                <span>AI context ready</span>
              </div>

              <pre class="profile-panel__cv-preview">{{ cvPreview }}<span v-if="form.cvContent.split('\n').length > 8" class="profile-panel__cv-more">…</span></pre>

              <div class="profile-panel__cv-actions">
                <a-button
                  size="small"
                  class="profile-panel__cv-replace"
                  :disabled="analyzing"
                  @click.stop="openFilePicker"
                >
                  <template #icon><UploadOutlined /></template>
                  Replace CV
                </a-button>
                <a-button
                  v-if="!hasCvContext && !analyzing"
                  size="small"
                  @click.stop="analyzeUploadedCv"
                >
                  <template #icon><AiSparkleIcon /></template>
                  Build AI context
                </a-button>
              </div>
            </div>
          </template>

          <template v-else>
            <FileTextOutlined class="profile-panel__drop-icon" />
            <span class="profile-panel__drop-text">
              Click or drag &amp; drop your CV here
            </span>
            <span class="profile-panel__drop-formats">PDF · DOCX · DOC · MD · TXT</span>
          </template>
        </div>

        <input
          ref="fileInput"
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md"
          hidden
          @change="handleFileSelected"
        />
      </a-form-item>

      <button
        type="button"
        class="profile-panel__context-toggle"
        :aria-expanded="contextExpanded"
        @click="toggleContextExpanded"
      >
        <span class="profile-panel__context-toggle-label">
          <AiSparkleIcon class="profile-panel__ai-icon profile-panel__ai-icon--inline" />
          {{ contextExpanded ? 'Hide context' : 'See context' }}
        </span>
        <DownOutlined v-if="!contextExpanded" class="profile-panel__context-toggle-icon" />
        <UpOutlined v-else class="profile-panel__context-toggle-icon" />
      </button>

      <a-form-item
        v-show="contextExpanded"
        name="cvContext"
        class="profile-panel__cv-context"
      >
        <template #label>AI context</template>
        <a-textarea
          v-model:value="form.cvContext"
          :rows="8"
          :disabled="analyzing"
          placeholder="AI summary of your experience, timeline, and skills appears here after upload. You can edit it anytime."
          class="profile-panel__cv-context-textarea"
          @blur="saveCvContext"
        />
      </a-form-item>
    </div>

    <a-alert
      v-if="form.cvNotes"
      type="info"
      show-icon
      closable
      class="profile-panel__cv-notes"
      @close="dismissCvNotes"
    >
      <template #message>What to improve for stronger CVs</template>
      <template #description>
        <span class="profile-panel__cv-notes-text">{{ form.cvNotes }}</span>
      </template>
    </a-alert>

    <a-form-item label="Additional context (optional)" name="coverLetter">
      <a-textarea
        v-model:value="form.coverLetter"
        placeholder="Any extra context for the AI: target roles, preferred industries, key skills to emphasize…"
        :rows="3"
        show-count
      />
    </a-form-item>

    <div class="profile-panel__section-title">Contact</div>

    <a-form-item label="Avatar" name="avatarFilePath">
      <div class="profile-panel__avatar-row">
        <button
          type="button"
          class="profile-panel__avatar"
          :class="{ 'profile-panel__avatar--empty': !hasAvatar }"
          @click="openAvatarPicker"
        >
          <img
            v-if="hasAvatar"
            :src="form.avatarDataUrl"
            alt="Avatar preview"
            class="profile-panel__avatar-image"
          />
          <UserOutlined v-else class="profile-panel__avatar-placeholder" />
        </button>
        <div class="profile-panel__avatar-meta">
          <div v-if="hasAvatar" class="profile-panel__avatar-name">
            {{ form.avatarFilePath }}
          </div>
          <div v-else class="profile-panel__avatar-name profile-panel__avatar-name--muted">
            Optional photo for PDF CV
          </div>
          <div class="profile-panel__avatar-actions">
            <a-button size="small" :loading="avatarLoading" @click="openAvatarPicker">
              <template #icon><UploadOutlined /></template>
              {{ hasAvatar ? 'Replace' : 'Upload' }}
            </a-button>
            <a-button
              v-if="hasAvatar"
              size="small"
              danger
              @click="clearAvatar"
            >
              Remove
            </a-button>
          </div>
        </div>
      </div>
      <input
        ref="avatarInput"
        type="file"
        accept="image/*"
        hidden
        @change="handleAvatarSelected"
      />
    </a-form-item>

    <div class="profile-panel__name-row">
      <a-form-item label="First name" name="firstName" required>
        <a-input v-model:value="form.firstName" placeholder="Jane" autocomplete="given-name" />
      </a-form-item>
      <a-form-item label="Last name" name="lastName" required>
        <a-input v-model:value="form.lastName" placeholder="Doe" autocomplete="family-name" />
      </a-form-item>
    </div>

    <a-form-item label="Email" name="email" required>
      <a-input v-model:value="form.email" placeholder="jane@example.com" autocomplete="email" />
    </a-form-item>

    <a-form-item label="Phone" name="phone">
      <a-input v-model:value="form.phone" placeholder="+1 555 0100" autocomplete="tel" />
    </a-form-item>

    <a-form-item label="LinkedIn profile" name="linkedIn">
      <a-input
        v-model:value="form.linkedIn"
        placeholder="linkedin.com/in/janedoe"
        autocomplete="url"
      />
    </a-form-item>

    <a-form-item label="Telegram" name="telegram">
      <a-input v-model:value="form.telegram" placeholder="@janedoe" />
    </a-form-item>

    <a-form-item label="Website" name="website">
      <a-input v-model:value="form.website" placeholder="https://janedoe.dev" autocomplete="url" />
    </a-form-item>

    <a-form-item class="profile-panel__submit">
      <a-button type="primary" html-type="submit" block :loading="saving">
        Save profile
      </a-button>
    </a-form-item>
  </a-form>
</template>

<style scoped>
.profile-panel {
  padding-bottom: 4px;
}

.profile-panel__label {
  font-size: 14px;
  font-weight: 600;
  color: var(--panel-title, rgba(0, 0, 0, 0.88));
  margin-bottom: 4px;
}

.profile-panel__section-title {
  margin: 4px 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--panel-title, rgba(0, 0, 0, 0.88));
}

.profile-panel__section-title--ai {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.profile-panel__ai-icon {
  color: #9254de;
  filter: drop-shadow(0 0 4px rgba(146, 84, 222, 0.45));
}

.popup--dark .profile-panel__ai-icon {
  color: #b37feb;
}

.profile-panel__hint {
  margin: 0 0 16px;
  font-size: 12px;
  color: var(--panel-subtitle, rgba(0, 0, 0, 0.45));
  line-height: 1.5;
}

.profile-panel__hint--compact {
  margin-top: -4px;
  margin-bottom: 12px;
}

.profile-panel__cv-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 4px;
}

.profile-panel__cv-upload,
.profile-panel__cv-context {
  margin-bottom: 0;
}

.profile-panel__cv-upload :deep(.ant-form-item-label),
.profile-panel__cv-context :deep(.ant-form-item-label) {
  padding-bottom: 4px;
}

.profile-panel__cv-upload :deep(.ant-form-item-label > label),
.profile-panel__cv-context :deep(.ant-form-item-label > label) {
  font-size: 12px;
  height: auto;
}

.profile-panel__context-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--theme-picker-border, #d9d9d9);
  border-radius: 8px;
  background: var(--theme-picker-bg, #fafafa);
  color: var(--panel-title, rgba(0, 0, 0, 0.75));
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
}

.profile-panel__context-toggle:hover {
  border-color: #9254de;
  background: var(--theme-picker-active-bg, #f9f0ff);
}

.profile-panel__context-toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.profile-panel__context-toggle-icon {
  font-size: 11px;
  color: var(--panel-subtitle, rgba(0, 0, 0, 0.45));
}

.profile-panel__ai-icon--inline {
  font-size: 12px;
}

.profile-panel__cv-context-textarea {
  font-size: 12px;
  line-height: 1.55;
  resize: vertical;
}

.profile-panel__avatar-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.profile-panel__avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 2px dashed var(--theme-picker-border, #d9d9d9);
  background: var(--theme-picker-bg, #fafafa);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
}

.profile-panel__avatar--empty:hover {
  border-color: #2f54eb;
}

.profile-panel__avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-panel__avatar-placeholder {
  font-size: 28px;
  color: var(--panel-subtitle, rgba(0, 0, 0, 0.35));
}

.profile-panel__avatar-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.profile-panel__avatar-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--panel-title, rgba(0, 0, 0, 0.85));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-panel__avatar-name--muted {
  color: var(--panel-subtitle, rgba(0, 0, 0, 0.45));
}

.profile-panel__avatar-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.profile-panel__name-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.profile-panel__name-row :deep(.ant-form-item) {
  margin-bottom: 12px;
}

.profile-panel__drop-zone {
  border: 2px dashed var(--theme-picker-border, #d9d9d9);
  border-radius: 12px;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
  min-height: 100px;
  background: var(--theme-picker-bg, #fafafa);
}

.profile-panel__drop-zone--active {
  border-color: #2f54eb;
  background: var(--theme-picker-active-bg, #f0f5ff);
}

.profile-panel__drop-zone--loaded {
  cursor: default;
  border-style: solid;
  border-color: #52c41a;
  padding: 12px 14px;
}

.profile-panel__drop-icon {
  font-size: 28px;
  color: var(--panel-subtitle, rgba(0, 0, 0, 0.35));
}

.profile-panel__drop-icon--spin {
  color: #2f54eb;
}

.profile-panel__drop-text {
  font-size: 13px;
  color: var(--panel-title, rgba(0, 0, 0, 0.65));
  font-weight: 500;
  text-align: center;
}

.profile-panel__drop-formats {
  font-size: 11px;
  color: var(--panel-subtitle, rgba(0, 0, 0, 0.4));
  letter-spacing: 0.03em;
}

.profile-panel__cv-loaded {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.profile-panel__cv-loaded-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-panel__cv-ok-icon {
  color: #52c41a;
  font-size: 16px;
  flex-shrink: 0;
}

.profile-panel__cv-filename {
  font-size: 13px;
  font-weight: 600;
  color: var(--panel-title, rgba(0, 0, 0, 0.85));
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-panel__cv-delete {
  flex-shrink: 0;
}

.profile-panel__cv-preview {
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--panel-subtitle, rgba(0, 0, 0, 0.45));
  background: transparent;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 90px;
  overflow: hidden;
  font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
}

.profile-panel__cv-more {
  color: var(--panel-subtitle, rgba(0, 0, 0, 0.35));
}

.profile-panel__cv-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.profile-panel__cv-replace {
  align-self: flex-start;
}

.profile-panel__cv-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
}

.profile-panel__cv-status--ready {
  color: #52c41a;
}

.profile-panel__cv-status--busy {
  color: #2f54eb;
}

.profile-panel__cv-notes {
  margin-bottom: 16px;
  border-radius: 8px;
}

.profile-panel__cv-notes-text {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.55;
}

.profile-panel__submit {
  margin-bottom: 0;
  margin-top: 8px;
}
</style>
