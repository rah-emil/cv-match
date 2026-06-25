export type ThemeMode = 'auto' | 'light' | 'dark'

export interface ExtensionSettings {
  openAiApiKey: string
  coverLetter: string
  openAiApiUrl: string
  model: string
  cvFilePath: string
  themeMode: ThemeMode
  systemPrompt: string
}

export const DEFAULT_SYSTEM_PROMPT = `Analyze my original CV, contact details, cover letter, and the full job description. Generate a tailored CV and cover letter optimized for this specific vacancy, with the goal of maximizing the perceived match for ATS systems, recruiters, HR managers, and company owners.

First, identify the role's core requirements: job title, seniority level, responsibilities, must-have skills, nice-to-have skills, tools, technologies, industry/domain keywords, soft skills, and business outcomes expected from the candidate.

Then transform my CV honestly and strategically:

* Use the same or very close terminology from the job description where it matches my real experience.
* Adapt role titles, summaries, skills, and experience descriptions to align with the vacancy, but do not invent facts, employers, dates, tools, achievements, certifications, or experience I do not have.
* If my original job title can be clarified with a common market equivalent, include it naturally, for example "Head of IT / DevOps Engineer", but do not misrepresent my actual role.
* Prioritize only the experience, projects, technologies, achievements, and responsibilities that are relevant to this vacancy.
* Remove or greatly reduce anything unrelated to the vacancy.
* Rewrite experience bullets to show concrete impact, ownership, scale, business value, technical stack, and measurable outcomes where supported by the source information.
* Include exact-match keywords from the job description naturally across the Summary, Skills, and Experience sections, avoiding keyword stuffing.
* Make the CV ATS-friendly: clean structure, standard section names, no tables, no graphics, no unnecessary formatting, and clear readable bullet points.
* Make the cover letter specific to the company and role, explaining why my background matches their needs and what value I can bring.

Before writing the final version, internally compare my profile against the vacancy and focus the CV on the strongest match areas. If something from my background does not support this specific application, omit it. The final output should feel human, professional, focused, and highly relevant to this exact job, not generic or obviously AI-generated.`

export const PRESET_MODELS = [
  'gpt-5.5',
  'gpt-5.4',
  'gpt-5.4-mini',
  'gpt-5.4-nano-2026-03-17',
  'gpt-5-nano-2025-08-07',
  'gpt-4o-mini-2024-07-18',
] as const

export const DEFAULT_SETTINGS: ExtensionSettings = {
  openAiApiKey: '',
  coverLetter: '',
  openAiApiUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
  cvFilePath: '',
  themeMode: 'auto',
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
}

export const SETTINGS_STORAGE_KEY = 'cv-match-settings'

export const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  auto: 'System',
  light: 'Light',
  dark: 'Dark',
}
