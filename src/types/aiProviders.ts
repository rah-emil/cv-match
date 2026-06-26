import type { ExtensionSettings } from './settings'

export type AiProvider = 'openai' | 'anthropic'

export interface AiProviderConfig {
  id: AiProvider
  label: string
  apiBaseUrl: string
  consoleUrl: string
  apiKeyPlaceholder: string
  presetModels: readonly string[]
  defaultCvModel: string
  defaultTaskModel: string
}

export const AI_PROVIDER_CONFIGS: Record<AiProvider, AiProviderConfig> = {
  openai: {
    id: 'openai',
    label: 'OpenAI',
    apiBaseUrl: 'https://api.openai.com/v1',
    consoleUrl: 'https://platform.openai.com/',
    apiKeyPlaceholder: 'sk-...',
    presetModels: [
      'gpt-5.5',
      'gpt-5.4',
      'gpt-5.4-mini',
      'gpt-5.4-nano-2026-03-17',
      'gpt-5-nano-2025-08-07',
      'gpt-4o',
      'gpt-4o-mini-2024-07-18',
    ],
    defaultCvModel: 'gpt-5.5',
    defaultTaskModel: 'gpt-5.4-mini',
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic',
    apiBaseUrl: 'https://api.anthropic.com/v1',
    consoleUrl: 'https://console.anthropic.com/',
    apiKeyPlaceholder: 'sk-ant-...',
    presetModels: [
      'claude-opus-4-20250514',
      'claude-sonnet-4-20250514',
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
    ],
    defaultCvModel: 'claude-sonnet-4-20250514',
    defaultTaskModel: 'claude-3-7-sonnet-20250219',
  },
}

export const AI_PROVIDER_OPTIONS = Object.values(AI_PROVIDER_CONFIGS).map(
  (config) => ({
    value: config.id,
    label: config.label,
  }),
)

export function getProviderConfig(provider: AiProvider): AiProviderConfig {
  return AI_PROVIDER_CONFIGS[provider]
}

export function resolveAiProvider(
  provider: AiProvider | string | undefined,
): AiProvider {
  return provider === 'anthropic' ? 'anthropic' : 'openai'
}

export function getPresetModels(provider: AiProvider): readonly string[] {
  return getProviderConfig(provider).presetModels
}

export function getApiBaseUrl(provider: AiProvider): string {
  return getProviderConfig(provider).apiBaseUrl
}

export function applyProviderChange(
  settings: ExtensionSettings,
  provider: AiProvider,
): ExtensionSettings {
  const config = getProviderConfig(provider)
  const presetModels = new Set<string>(config.presetModels)

  return {
    ...settings,
    aiProvider: provider,
    openAiApiUrl: config.apiBaseUrl,
    model: presetModels.has(settings.model)
      ? settings.model
      : config.defaultCvModel,
    matchAssessmentModel: presetModels.has(settings.matchAssessmentModel)
      ? settings.matchAssessmentModel
      : config.defaultTaskModel,
  }
}

export function syncProviderApiUrl(settings: ExtensionSettings): ExtensionSettings {
  const provider = resolveAiProvider(settings.aiProvider)
  return {
    ...settings,
    aiProvider: provider,
    openAiApiUrl: getApiBaseUrl(provider),
  }
}
