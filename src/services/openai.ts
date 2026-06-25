import type { ExtensionSettings } from '../types/settings'

const SYSTEM_PROMPT = `You are an expert CV/resume writer and career coach.

Your task is to adapt the candidate's existing CV for a specific job posting.

IMPORTANT RULES:
- NEVER fabricate experience, skills, or qualifications the candidate does not have
- ONLY reorganize, rephrase, and emphasize existing experience to match the job requirements
- Use keywords and terminology from the job posting where they honestly apply
- Highlight relevant projects, achievements, and skills that align with the role
- Adjust the professional summary/objective to target this specific position
- Reorder sections to put the most relevant experience first
- Quantify achievements where possible using existing data
- Keep the tone professional and concise
- Match the language of the job posting (if the job posting is in English, write the CV in English, etc.)
- Format the output as clean, well-structured text ready to be used as a CV

The goal is to make the candidate appear as relevant as possible to ATS systems and HR reviewers, while remaining 100% truthful about their actual experience and qualifications.`

export interface GenerateCvRequest {
  settings: ExtensionSettings
  jobText: string
}

export interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function generateCv(req: GenerateCvRequest): Promise<string> {
  const { settings, jobText } = req
  const url = `${settings.openAiApiUrl.replace(/\/+$/, '')}/chat/completions`

  const userMessage = buildUserMessage(settings, jobText)

  const messages: OpenAiMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ]

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages,
      temperature: 0.4,
      max_tokens: 4096,
    }),
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

function buildUserMessage(
  settings: ExtensionSettings,
  jobText: string,
): string {
  const parts: string[] = []

  parts.push('=== JOB POSTING ===')
  parts.push(jobText)

  if (settings.cvFilePath.trim()) {
    parts.push('\n=== CANDIDATE CV FILE PATH ===')
    parts.push(settings.cvFilePath)
  }

  if (settings.coverLetter.trim()) {
    parts.push('\n=== CANDIDATE BACKGROUND / COVER LETTER ===')
    parts.push(settings.coverLetter)
  }

  parts.push(
    '\n=== INSTRUCTIONS ===',
    'Based on the job posting above and the candidate information provided, generate an adapted CV.',
    'Reorganize and rephrase the candidate\'s experience to highlight relevance to this specific role.',
    'Do NOT invent any experience or skills — only adapt and emphasize what is real.',
  )

  return parts.join('\n')
}

export { SYSTEM_PROMPT, buildUserMessage }
