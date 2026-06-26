import { DEFAULT_CV_ANALYSIS_PROMPT, type ExtensionSettings } from '../types/settings'
import { resolveAiProvider } from '../types/aiProviders'

export interface GenerateCvRequest {
  settings: ExtensionSettings
  jobText: string
}

export interface EvaluateMatchRequest {
  settings: ExtensionSettings
  jobText: string
}

export interface AnalyzeCvRequest {
  settings: ExtensionSettings
  cvText: string
}

/** Contact details extracted from the CV to auto-fill the profile. */
export interface CvProfile {
  firstName: string
  lastName: string
  email: string
  phone: string
  linkedIn: string
  telegram: string
  website: string
}

/** Distilled, reusable CV context produced once on upload. */
export interface CvAnalysis {
  cvContext: string
  notes: string
  profile: CvProfile
}

export const EMPTY_CV_PROFILE: CvProfile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  linkedIn: '',
  telegram: '',
  website: '',
}

export interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** Structured result the model must return for a single CV generation call. */
export interface GeneratedCv {
  cvContent: string
  coverLetter: string
  matchComment: string
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
  extra: Record<string, unknown> = {},
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
    ...extra,
  }
}

async function completeChat(
  settings: ExtensionSettings,
  messages: OpenAiMessage[],
  model = settings.model,
  extra: Record<string, unknown> = {},
): Promise<string> {
  if (resolveAiProvider(settings.aiProvider) === 'anthropic') {
    return completeAnthropicChat(settings, messages, model, extra)
  }

  return completeOpenAiChat(settings, messages, model, extra)
}

async function completeOpenAiChat(
  settings: ExtensionSettings,
  messages: OpenAiMessage[],
  model = settings.model,
  extra: Record<string, unknown> = {},
): Promise<string> {
  const url = `${settings.openAiApiUrl.replace(/\/+$/, '')}/chat/completions`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.openAiApiKey}`,
    },
    body: JSON.stringify(buildCompletionBody(settings, messages, model, extra)),
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

async function completeAnthropicChat(
  settings: ExtensionSettings,
  messages: OpenAiMessage[],
  model = settings.model,
  extra: Record<string, unknown> = {},
): Promise<string> {
  const url = `${settings.openAiApiUrl.replace(/\/+$/, '')}/messages`
  const systemMessage = messages.find((message) => message.role === 'system')
  const conversationMessages = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content,
    }))

  const body: Record<string, unknown> = {
    model,
    max_tokens: settings.maxOutputTokens || 4096,
    temperature: 0.4,
    messages: conversationMessages,
    ...(systemMessage ? { system: systemMessage.content } : {}),
    ...extra,
  }

  delete body.response_format

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.openAiApiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Anthropic API error ${response.status}: ${errorBody}`)
  }

  const data = (await response.json()) as {
    content?: { type: string; text?: string }[]
  }

  const content = data.content
    ?.map((block) => (block.type === 'text' ? block.text ?? '' : ''))
    .join('')
    .trim()

  if (!content) {
    throw new Error('Anthropic returned an empty response')
  }

  return content
}

export async function generateCv(req: GenerateCvRequest): Promise<GeneratedCv> {
  const { settings, jobText } = req

  const raw = await completeChat(
    settings,
    [
      { role: 'system', content: buildCvSystemMessage(settings) },
      { role: 'user', content: buildUserMessage(settings, jobText) },
    ],
    settings.model,
    { response_format: { type: 'json_object' } },
  )

  return parseGeneratedCv(raw)
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

export async function analyzeCv(req: AnalyzeCvRequest): Promise<CvAnalysis> {
  const { settings, cvText } = req
  const model = settings.matchAssessmentModel || settings.model

  const raw = await completeChat(
    settings,
    [
      { role: 'system', content: DEFAULT_CV_ANALYSIS_PROMPT },
      { role: 'user', content: buildCvAnalysisUserMessage(cvText) },
    ],
    model,
    { response_format: { type: 'json_object' } },
  )

  return parseCvAnalysis(raw)
}

export function buildCvAnalysisUserMessage(cvText: string): string {
  return [
    '=== RAW CV TEXT ===',
    cvText.trim() || '(empty CV)',
    '',
    '=== OUTPUT FORMAT ===',
    'Return a single valid JSON object with exactly the fields cvContext, notes, and profile.',
    'cvContext MUST include a "Career timeline" section with dates for every role and education entry found in the CV.',
    'Do not include any text or code fences outside the JSON object.',
  ].join('\n')
}

function normalizeCvContextField(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (value && typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return ''
    }
  }
  return ''
}

function parseCvProfile(value: unknown): CvProfile {
  if (!value || typeof value !== 'object') {
    return { ...EMPTY_CV_PROFILE }
  }

  const source = value as Record<string, unknown>
  const read = (key: keyof CvProfile): string =>
    typeof source[key] === 'string' ? (source[key] as string).trim() : ''

  return {
    firstName: read('firstName'),
    lastName: read('lastName'),
    email: read('email'),
    phone: read('phone'),
    linkedIn: read('linkedIn'),
    telegram: read('telegram'),
    website: read('website'),
  }
}

export function parseCvAnalysis(raw: string): CvAnalysis {
  try {
    const parsed = JSON.parse(extractJsonBlock(raw)) as Record<string, unknown>
    const cvContext = normalizeCvContextField(parsed.cvContext)
    const notes = typeof parsed.notes === 'string' ? parsed.notes.trim() : ''
    const profile = parseCvProfile(parsed.profile)

    if (cvContext) {
      return { cvContext, notes, profile }
    }
  } catch {
    // Fall back to treating the whole response as the distilled context.
  }

  return { cvContext: raw.trim(), notes: '', profile: { ...EMPTY_CV_PROFILE } }
}

export function buildCvSystemMessage(settings: ExtensionSettings): string {
  return [
    settings.systemPrompt,
    '',
    '=== COVER LETTER INSTRUCTIONS ===',
    settings.coverLetterPrompt,
    '',
    '=== OUTPUT CONTRACT ===',
    'Respond with ONE valid JSON object and nothing else, using exactly these string fields:',
    '{"cvContent": "...", "coverLetter": "...", "matchComment": "..."}',
    '- cvContent: the tailored CV as clean Markdown, following the CV instructions above. It MUST contain only the CV itself — no preamble, notes, commentary, explanations, or match analysis.',
    '- coverLetter: a tailored cover letter as plain prose, following the cover letter instructions above.',
    '- matchComment: a short note (2–4 sentences) on how well the candidate matches this specific vacancy, including notable gaps.',
    'Never place commentary, analysis, or notes inside cvContent — put them in matchComment instead.',
    'Do not wrap the JSON in code fences. Do not output anything before or after the JSON. All three fields are required and must be non-empty strings.',
  ].join('\n')
}

function extractJsonBlock(raw: string): string {
  let text = raw.trim()

  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(text)
  if (fenced) text = fenced[1].trim()

  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) {
    return text.slice(first, last + 1)
  }

  return text
}

export function parseGeneratedCv(raw: string): GeneratedCv {
  try {
    const parsed = JSON.parse(extractJsonBlock(raw)) as Partial<
      Record<keyof GeneratedCv, unknown>
    >
    const cvContent =
      typeof parsed.cvContent === 'string' ? parsed.cvContent.trim() : ''

    if (cvContent) {
      return {
        cvContent,
        coverLetter:
          typeof parsed.coverLetter === 'string' ? parsed.coverLetter.trim() : '',
        matchComment:
          typeof parsed.matchComment === 'string'
            ? parsed.matchComment.trim()
            : '',
      }
    }
  } catch {
    // Fall back to treating the whole response as the CV body.
  }

  return { cvContent: raw.trim(), coverLetter: '', matchComment: '' }
}

function buildContactDetailsSection(settings: ExtensionSettings): string {
  const lines: string[] = []

  const fullName = [settings.firstName, settings.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ')

  if (fullName) lines.push(`Name: ${fullName}`)
  if (settings.email.trim()) lines.push(`Email: ${settings.email.trim()}`)
  if (settings.phone.trim()) lines.push(`Phone: ${settings.phone.trim()}`)
  if (settings.linkedIn.trim()) lines.push(`LinkedIn: ${settings.linkedIn.trim()}`)
  if (settings.telegram.trim()) lines.push(`Telegram: ${settings.telegram.trim()}`)
  if (settings.website.trim()) lines.push(`Website: ${settings.website.trim()}`)

  if (lines.length === 0) {
    return '(no contact details in profile — use what is available in the CV)'
  }

  return lines.join('\n')
}

function buildBaseUserMessage(settings: ExtensionSettings, jobText: string): string {
  const parts: string[] = []

  parts.push('=== JOB DESCRIPTION ===')
  parts.push(jobText)

  parts.push('\n=== CONTACT DETAILS ===')
  parts.push(buildContactDetailsSection(settings))

  parts.push('\n=== MY CV ===')
  const cvForPrompt = settings.cvContext.trim() || settings.cvContent.trim()
  if (cvForPrompt) {
    parts.push(cvForPrompt)
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
    'Return your answer as a single valid JSON object, exactly as described in the system instructions.',
    'The JSON must contain the fields: cvContent, coverLetter, matchComment.',
    'cvContent must be clean Markdown (## headings, - bullet points, ** bold **) and contain only the CV — no commentary.',
    'Do not include any text or code fences outside the JSON object.',
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
    'Then provide only 3–6 short Markdown bullet points.',
    'If the candidate does not fit, focus only on why not.',
    'If the candidate almost fits, focus only on mismatch areas and missing signals.',
    'If the candidate fits well, give one short reason why and do not list obvious strengths.',
    'Do not wrap the output in a code block.',
  )

  return parts.join('\n')
}
