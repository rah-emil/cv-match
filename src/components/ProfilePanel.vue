<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  CheckCircleOutlined,
  DeleteOutlined,
  FileTextOutlined,
  LoadingOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { ExtensionSettings } from '../types/settings'
import { AVATAR_MAX_BYTES, readImageAsDataUrl } from '../services/avatarReader'
import { readCvFile } from '../services/cvReader'
import { getMissingRequiredProfileFields } from '../utils/autoFillProfile'

const props = defineProps<{
  settings: ExtensionSettings
  saving: boolean
}>()

const emit = defineEmits<{
  save: [settings: ExtensionSettings, silent?: boolean]
}>()

const form = reactive<ExtensionSettings>({ ...props.settings })
const fileInput = ref<HTMLInputElement | null>(null)
const avatarInput = ref<HTMLInputElement | null>(null)
const parsing = ref(false)
const avatarLoading = ref(false)
const dragOver = ref(false)

const hasCvContent = computed(() => form.cvContent.trim().length > 0)
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
    emit('save', { ...form }, true)
    message.success(`CV loaded: ${result.fileName} (${result.text.length.toLocaleString()} chars)`)
  } catch (e) {
    message.error((e as Error).message)
  } finally {
    parsing.value = false
  }
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
      Contact details for auto-fill on job forms. CV upload is used for AI tailoring.
    </p>

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

    <div class="profile-panel__section-title">CV</div>
    <p class="profile-panel__hint profile-panel__hint--compact">
      Upload your CV — the extension will read it and tailor it to each job.
    </p>

    <a-form-item name="cvContent">
      <div
        class="profile-panel__drop-zone"
        :class="{
          'profile-panel__drop-zone--active': dragOver,
          'profile-panel__drop-zone--loaded': hasCvContent,
        }"
        @click="!hasCvContent && openFilePicker()"
        @drop.prevent="handleDrop"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
      >
        <template v-if="parsing">
          <LoadingOutlined class="profile-panel__drop-icon profile-panel__drop-icon--spin" />
          <span class="profile-panel__drop-text">Reading CV…</span>
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
                  @click.stop="clearCv"
                >
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
            </div>
            <pre class="profile-panel__cv-preview">{{ cvPreview }}<span v-if="form.cvContent.split('\n').length > 8" class="profile-panel__cv-more">…</span></pre>
            <a-button
              size="small"
              class="profile-panel__cv-replace"
              @click.stop="openFilePicker"
            >
              <template #icon><UploadOutlined /></template>
              Replace CV
            </a-button>
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

    <a-form-item label="Additional context (optional)" name="coverLetter">
      <a-textarea
        v-model:value="form.coverLetter"
        placeholder="Any extra context for the AI: target roles, preferred industries, key skills to emphasize…"
        :rows="3"
        show-count
      />
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

.profile-panel__cv-replace {
  align-self: flex-start;
}

.profile-panel__submit {
  margin-bottom: 0;
  margin-top: 8px;
}
</style>
