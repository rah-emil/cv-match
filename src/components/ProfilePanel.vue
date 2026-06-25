<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { FolderOpenOutlined, SaveOutlined } from '@ant-design/icons-vue'
import type { ExtensionSettings } from '../types/settings'

const props = defineProps<{
  settings: ExtensionSettings
  saving: boolean
}>()

const emit = defineEmits<{
  save: [settings: ExtensionSettings, silent?: boolean]
}>()

const form = reactive<ExtensionSettings>({ ...props.settings })
const fileInput = ref<HTMLInputElement | null>(null)

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

function openFilePicker() {
  fileInput.value?.click()
}

function handleFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  form.cvFilePath = file.name
  input.value = ''
}
</script>

<template>
  <a-form
    :model="form"
    layout="vertical"
    class="profile-panel"
    @finish="handleSubmit"
  >
    <div class="profile-panel__label">Your profile</div>
    <p class="profile-panel__hint">
      Your experience and CV. This is used to tailor your CV to each job.
    </p>

    <a-form-item label="Cover letter" name="coverLetter">
      <a-textarea
        v-model:value="form.coverLetter"
        placeholder="Describe your experience, skills and background..."
        :rows="6"
        show-count
      />
    </a-form-item>

    <a-form-item label="CV file path" name="cvFilePath">
      <a-input-group compact>
        <a-input
          v-model:value="form.cvFilePath"
          placeholder="/Users/you/Documents/cv.pdf"
          style="width: calc(100% - 40px)"
        />
        <a-tooltip title="Choose file">
          <a-button @click="openFilePicker">
            <template #icon>
              <FolderOpenOutlined />
            </template>
          </a-button>
        </a-tooltip>
      </a-input-group>
      <input
        ref="fileInput"
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md"
        hidden
        @change="handleFileSelected"
      />
    </a-form-item>

    <a-form-item class="profile-panel__submit">
      <a-button type="primary" html-type="submit" block :loading="saving">
        <template #icon>
          <SaveOutlined />
        </template>
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

.profile-panel__hint {
  margin: 0 0 16px;
  font-size: 12px;
  color: var(--panel-subtitle, rgba(0, 0, 0, 0.45));
  line-height: 1.5;
}

.profile-panel__submit {
  margin-bottom: 0;
  margin-top: 8px;
}
</style>
