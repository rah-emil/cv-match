<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  BarChartOutlined,
  CheckOutlined,
  CopyOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FormOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { ExtensionSettings } from '../types/settings'
import { downloadCvPdf } from '../services/cvPdf'
import { evaluateMatch, generateCv } from '../services/openai'
import {
  extractAutofillProfile,
  getMissingRequiredProfileFields,
} from '../utils/autoFillProfile'
import {
  getMatchScorePresentation,
  parseMatchScore,
  stripScoreLine,
  type MatchScorePresentation,
} from '../utils/matchScore'
import MarkdownContent from './MarkdownContent.vue'

const props = defineProps<{
  settings: ExtensionSettings
}>()

const generating = ref(false)
const evaluating = ref(false)
const filling = ref(false)
const cvResult = ref('')
const matchResult = ref('')
const matchScore = ref<MatchScorePresentation | null>(null)
const copiedCv = ref(false)
const downloadingPdf = ref(false)
const error = ref('')

const matchScoreDisplay = computed(() => {
  if (!matchScore.value) return null
  const formatted =
    Number.isInteger(matchScore.value.score)
      ? String(matchScore.value.score)
      : matchScore.value.score.toFixed(1)
  return { ...matchScore.value, formatted }
})

const matchResultBody = computed(() => stripScoreLine(matchResult.value))

async function extractJobTextFromPage(): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) throw new Error('No active tab found')

  const response = await chrome.tabs.sendMessage(tab.id, {
    action: 'extractJobText',
  })

  if (!response?.error) {
    if (response?.text?.trim()) return response.text
  } else {
    throw new Error(response.error)
  }

  throw new Error('Could not extract job text from the page')
}

function validatePrerequisites(): boolean {
  if (!props.settings.openAiApiKey.trim()) {
    message.warning('Add your OpenAI API key in Settings')
    return false
  }

  if (!props.settings.cvContent.trim()) {
    message.warning('Upload your CV in the Profile tab first')
    return false
  }

  return true
}

async function handleEvaluateMatch() {
  if (!validatePrerequisites()) return

  evaluating.value = true
  matchResult.value = ''
  matchScore.value = null
  error.value = ''

  try {
    const jobText = await extractJobTextFromPage()
    message.info('Evaluating your match for this vacancy...')

    const assessment = await evaluateMatch({
      settings: props.settings,
      jobText,
    })

    matchResult.value = assessment

    const score = parseMatchScore(assessment)
    if (score !== null) {
      matchScore.value = getMatchScorePresentation(score)
    }

    message.success('Done')
  } catch (e) {
    const msg = (e as Error).message
    error.value = msg
    message.error(msg)
  } finally {
    evaluating.value = false
  }
}

async function handleGenerateCv() {
  if (!validatePrerequisites()) return

  generating.value = true
  cvResult.value = ''
  error.value = ''

  try {
    const jobText = await extractJobTextFromPage()
    message.info('Analyzing the job and generating your CV...')

    const generated = await generateCv({
      settings: props.settings,
      jobText,
    })

    cvResult.value = generated
    message.success('CV generated — download PDF below')
  } catch (e) {
    const msg = (e as Error).message
    error.value = msg
    message.error(msg)
  } finally {
    generating.value = false
  }
}

async function handleCopyCv() {
  await navigator.clipboard.writeText(cvResult.value)
  copiedCv.value = true
  message.success('Copied to clipboard')
  setTimeout(() => {
    copiedCv.value = false
  }, 2000)
}

async function handleDownloadPdf() {
  downloadingPdf.value = true
  try {
    message.info('Building PDF...')
    await downloadCvPdf(cvResult.value, undefined, {
      avatarDataUrl: props.settings.avatarDataUrl,
    })
    message.success('Downloaded as PDF')
  } catch (e) {
    message.error((e as Error).message)
  } finally {
    downloadingPdf.value = false
  }
}

function handleDownloadMarkdown() {
  const blob = new Blob([cvResult.value], { type: 'text/markdown; charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tailored-cv-${new Date().toISOString().slice(0, 10)}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  message.success('Downloaded as .md file')
}

async function handleAutoFillForm() {
  const missing = getMissingRequiredProfileFields(props.settings)
  if (missing.length > 0) {
    message.warning(`Fill in Profile: ${missing.join(', ')}`)
    return
  }

  filling.value = true
  error.value = ''

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) throw new Error('No active tab found')

    const profile = extractAutofillProfile(props.settings)
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'autoFillForm',
      profile,
    })

    if (response?.error) throw new Error(response.error)

    const filledCount = response?.filledCount ?? 0
    if (filledCount === 0) {
      message.warning('No matching empty fields found on this page')
      return
    }

    message.success(`Auto-filled ${filledCount} field${filledCount === 1 ? '' : 's'}`)
  } catch (e) {
    const msg = (e as Error).message
    if (msg.includes('Receiving end does not exist')) {
      error.value = 'Reload the page and try again'
      message.error(error.value)
    } else {
      error.value = msg
      message.error(msg)
    }
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
        Open a job posting, evaluate your fit, then generate a tailored CV when
        it makes sense to apply.
      </p>
    </div>

    <div class="main-panel__actions">
      <a-button
        size="large"
        block
        :loading="evaluating"
        class="main-panel__button main-panel__button--evaluate"
        @click="handleEvaluateMatch"
      >
        <template #icon>
          <BarChartOutlined />
        </template>
        {{ evaluating ? 'Evaluating...' : 'Evaluate match' }}
      </a-button>

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
        @click="handleAutoFillForm"
      >
        <template #icon>
          <FormOutlined />
        </template>
        {{ filling ? 'Filling...' : 'Auto-fill form' }}
      </a-button>
    </div>

    <a-alert
      v-if="error && !generating && !evaluating"
      type="error"
      show-icon
      closable
      :message="error"
      class="main-panel__alert"
      @close="error = ''"
    />

    <div v-if="matchResult" class="main-panel__match">
      <div
        v-if="matchScoreDisplay"
        class="main-panel__score-card"
        :data-band="matchScoreDisplay.band"
      >
        <div class="main-panel__score-label">Fit</div>
        <div class="main-panel__score-row">
          <span class="main-panel__score-value">
            {{ matchScoreDisplay.formatted }}
          </span>
          <span class="main-panel__score-max">/ 10</span>
        </div>
        <div class="main-panel__score-verdict">
          {{ matchScoreDisplay.label }}
        </div>
      </div>

      <div class="main-panel__match-body">
        <MarkdownContent :source="matchResultBody" />
      </div>
    </div>

    <div v-if="cvResult" class="main-panel__result">
      <div class="main-panel__result-header">
        <span class="main-panel__result-title">Generated CV</span>
        <div class="main-panel__result-actions">
          <a-tooltip title="Download PDF">
            <a-button
              size="small"
              type="primary"
              :loading="downloadingPdf"
              @click="handleDownloadPdf"
            >
              <template #icon><FilePdfOutlined /></template>
              PDF
            </a-button>
          </a-tooltip>
          <a-tooltip title="Download Markdown">
            <a-button size="small" @click="handleDownloadMarkdown">
              <template #icon><DownloadOutlined /></template>
            </a-button>
          </a-tooltip>
          <a-button size="small" @click="handleCopyCv">
            <template #icon>
              <CheckOutlined v-if="copiedCv" />
              <CopyOutlined v-else />
            </template>
            {{ copiedCv ? 'Copied' : 'Copy' }}
          </a-button>
        </div>
      </div>
      <div class="main-panel__result-body">
        <pre>{{ cvResult }}</pre>
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

.main-panel__button--evaluate {
  border-color: var(--evaluate-btn-border, #b7eb8f);
  background: var(--evaluate-btn-bg, #f6ffed);
  color: var(--evaluate-btn-text, #389e0d);
}

.main-panel__button--evaluate:hover {
  border-color: var(--evaluate-btn-hover-border, #95de64) !important;
  background: var(--evaluate-btn-hover-bg, #eef9e6) !important;
  color: var(--evaluate-btn-hover-text, #237804) !important;
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

.main-panel__match {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.main-panel__score-card {
  text-align: center;
  padding: 20px 16px;
  border: 2px solid var(--score-border);
  border-radius: 12px;
  background: var(--score-bg);
  color: var(--score-text);
}

.main-panel__score-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--score-muted);
  margin-bottom: 4px;
}

.main-panel__score-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.main-panel__score-value {
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--score-text);
}

.main-panel__score-max {
  font-size: 22px;
  font-weight: 500;
  color: var(--score-muted);
}

.main-panel__score-verdict {
  margin-top: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--score-text);
}

.main-panel__match-body {
  padding: 14px;
  max-height: 420px;
  overflow-y: auto;
  border: 1px solid var(--result-border, #d9d9d9);
  border-radius: 10px;
  background: var(--result-header-bg, #fafafa);
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

.main-panel__result-actions {
  display: flex;
  align-items: center;
  gap: 6px;
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
