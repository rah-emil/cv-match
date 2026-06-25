<script setup lang="ts">
import { ref } from 'vue'
import {
  FileTextOutlined,
  FormOutlined,
  CopyOutlined,
  CheckOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { ExtensionSettings } from '../types/settings'
import { generateCv } from '../services/openai'

const props = defineProps<{
  settings: ExtensionSettings
}>()

const generating = ref(false)
const filling = ref(false)
const result = ref('')
const copied = ref(false)
const error = ref('')

async function extractJobTextFromPage(): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) throw new Error('No active tab found')

  const response = await chrome.tabs.sendMessage(tab.id, {
    action: 'extractJobText',
  })

  if (response?.error) throw new Error(response.error)
  if (!response?.text?.trim()) {
    throw new Error('Could not extract job text from the page')
  }

  return response.text
}

async function handleGenerateCv() {
  if (!props.settings.openAiApiKey.trim()) {
    message.warning('Add your OpenAI API key in Settings')
    return
  }

  if (!props.settings.coverLetter.trim()) {
    message.warning('Add your experience in the Profile tab')
    return
  }

  generating.value = true
  result.value = ''
  error.value = ''

  try {
    const jobText = await extractJobTextFromPage()
    message.info('Analyzing the job and generating your CV...')

    const generated = await generateCv({
      settings: props.settings,
      jobText,
    })

    result.value = generated
    message.success('CV generated successfully')
  } catch (e) {
    const msg = (e as Error).message
    error.value = msg
    message.error(msg)
  } finally {
    generating.value = false
  }
}

async function handleCopy() {
  await navigator.clipboard.writeText(result.value)
  copied.value = true
  message.success('Copied to clipboard')
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

async function handleFillForm() {
  filling.value = true
  try {
    message.info('Fill form — coming soon')
  } finally {
    filling.value = false
  }
}
</script>

<template>
  <div class="main-panel">
    <div class="main-panel__hero">
      <div class="main-panel__badge">AI Match</div>
      <h2 class="main-panel__title">Prepare your application</h2>
      <p class="main-panel__subtitle">
        Open a job posting and click Generate CV — the extension analyzes the
        job and tailors your CV to it.
      </p>
    </div>

    <div class="main-panel__actions">
      <a-button
        type="primary"
        size="large"
        block
        :loading="generating"
        class="main-panel__button main-panel__button--primary"
        @click="handleGenerateCv"
      >
        <template #icon>
          <FileTextOutlined />
        </template>
        {{ generating ? 'Generating...' : 'Generate CV' }}
      </a-button>

      <a-button
        size="large"
        block
        :loading="filling"
        class="main-panel__button main-panel__button--secondary"
        @click="handleFillForm"
      >
        <template #icon>
          <FormOutlined />
        </template>
        Fill form
      </a-button>
    </div>

    <a-alert
      v-if="error && !generating"
      type="error"
      show-icon
      closable
      :message="error"
      class="main-panel__alert"
      @close="error = ''"
    />

    <div v-if="result" class="main-panel__result">
      <div class="main-panel__result-header">
        <span class="main-panel__result-title">Generated CV</span>
        <a-button size="small" @click="handleCopy">
          <template #icon>
            <CheckOutlined v-if="copied" />
            <CopyOutlined v-else />
          </template>
          {{ copied ? 'Copied' : 'Copy' }}
        </a-button>
      </div>
      <div class="main-panel__result-body">
        <pre>{{ result }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-panel__hero {
  text-align: center;
}

.main-panel__badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--badge-bg, #f0f5ff);
  color: var(--badge-color, #2f54eb);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.main-panel__title {
  margin: 12px 0 8px;
  font-size: 22px;
  font-weight: 600;
  color: var(--panel-title, rgba(0, 0, 0, 0.88));
}

.main-panel__subtitle {
  margin: 0;
  color: var(--panel-subtitle, rgba(0, 0, 0, 0.45));
  font-size: 13px;
  line-height: 1.5;
}

.main-panel__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.main-panel__button {
  height: 48px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 10px;
}

.main-panel__button--primary {
  box-shadow: 0 8px 20px rgba(47, 84, 235, 0.25);
}

.main-panel__button--secondary {
  border-color: #d9d9d9;
}

.main-panel__alert {
  border-radius: 8px;
}

.main-panel__result {
  border: 1px solid var(--result-border, #d9d9d9);
  border-radius: 10px;
  overflow: hidden;
}

.main-panel__result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--result-header-bg, #fafafa);
  border-bottom: 1px solid var(--result-header-border, #f0f0f0);
}

.main-panel__result-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--result-title, rgba(0, 0, 0, 0.65));
}

.main-panel__result-body {
  padding: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.main-panel__result-body pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  line-height: 1.6;
  color: var(--result-text, rgba(0, 0, 0, 0.85));
}
</style>
