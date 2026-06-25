import type { ExtensionSettings } from '../types/settings'

export interface GenerateCvRequest {
  settings: ExtensionSettings
  jobText: string
}

export interface EvaluateMatchRequest {
  settings: ExtensionSettings
  jobText: string
}

export interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** Newer OpenAI models require max_completion_tokens instead of max_tokens. */
export function usesMaxCompletionTokens(model: string): boolean {
  const m = model.toLowerCase()
  return (
    m.startsWith('gpt-5') ||
    m.startsWith('gpt-4.1') ||
    m.startsWith('o1') ||
    m.startsWith('o3') ||
    m.startsWith('o4')
  )
}

export function buildCompletionBody(
  settings: ExtensionSettings,
  messages: OpenAiMessage[],
  model = settings.model,
) {
  const tokens = settings.maxOutputTokens || 4096
  const limit = { max_completion_tokens: tokens } as const
  const legacyLimit = { max_tokens: tokens } as const
  const newModel = usesMaxCompletionTokens(model)

  return {
    model,
    messages,
    ...(newModel ? {} : { temperature: 0.4 }),
    ...(newModel ? limit : legacyLimit),
  }
}

async function completeChat(
  settings: ExtensionSettings,
  messages: OpenAiMessage[],
  model = settings.model,
): Promise<string> {
  const url = `${settings.openAiApiUrl.replace(/\/+$/, '')}/chat/completions`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.openAiApiKey}`,
    },
    body: JSON.stringify(buildCompletionBody(settings, messages, model)),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OpenAI API error ${response.status}: ${body}`)
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[]
  }

  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('OpenAI returned an empty response')
  }

  return content
}

export async function generateCv(req: GenerateCvRequest): Promise<string> {
  const { settings, jobText } = req

  return completeChat(settings, [
    { role: 'system', content: settings.systemPrompt },
    { role: 'user', content: buildUserMessage(settings, jobText) },
  ])
}

export async function evaluateMatch(req: EvaluateMatchRequest): Promise<string> {
  const { settings, jobText } = req
  const model = settings.matchAssessmentModel || settings.model

  return completeChat(
    settings,
    [
      { role: 'system', content: settings.matchAssessmentPrompt },
      { role: 'user', content: buildMatchAssessmentUserMessage(settings, jobText) },
    ],
    model,
  )
}

function buildBaseUserMessage(settings: ExtensionSettings, jobText: string): string {
  const parts: string[] = []

  parts.push('=== JOB DESCRIPTION ===')
  parts.push(jobText)

  parts.push('\n=== MY CV ===')
  if (settings.cvContent.trim()) {
    parts.push(settings.cvContent)
  } else {
    parts.push('(no CV uploaded — use the information available to generate the best possible output)')
  }

  if (settings.coverLetter.trim()) {
    parts.push('\n=== ADDITIONAL CONTEXT ===')
    parts.push(settings.coverLetter)
  }

  return parts.join('\n')
}

export function buildUserMessage(
  settings: ExtensionSettings,
  jobText: string,
): string {
  const parts = [buildBaseUserMessage(settings, jobText)]

  parts.push('\n=== OUTPUT FORMAT ===')
  parts.push(
    'Return the tailored CV as clean Markdown.',
    'Use standard Markdown headings (##), bullet points (-), and bold (**) where appropriate.',
    'Do not wrap the output in a code block. Start directly with the CV content.',
  )

  return parts.join('\n')
}

export function buildMatchAssessmentUserMessage(
  settings: ExtensionSettings,
  jobText: string,
): string {
  const parts = [buildBaseUserMessage(settings, jobText)]

  parts.push('\n=== OUTPUT FORMAT ===')
  parts.push(
    'Start with a line exactly in this format: Overall Match Score: X/10',
    'Where X is your numeric score from 0 to 10 (decimals allowed, e.g. 7.5/10).',
    'Then provide the full assessment using numbered sections 2–7 from the system instructions.',
    'Use clear Markdown headings (##) and bullet points (-).',
    'Do not wrap the output in a code block.',
  )

  return parts.join('\n')
}
