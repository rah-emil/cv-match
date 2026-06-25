export type ThemeMode = 'auto' | 'light' | 'dark'

export interface ExtensionSettings {
  openAiApiKey: string
  coverLetter: string
  openAiApiUrl: string
  model: string
  matchAssessmentModel: string
  cvFilePath: string
  cvContent: string
  themeMode: ThemeMode
  systemPrompt: string
  matchAssessmentPrompt: string
  maxOutputTokens: number
  avatarFilePath: string
  avatarDataUrl: string
  firstName: string
  lastName: string
  email: string
  phone: string
  linkedIn: string
  telegram: string
  website: string
}

export const DEFAULT_SYSTEM_PROMPT = `Analyze my original CV, contact details, and the full job description. Generate a tailored CV optimized for this specific vacancy, with the goal of maximizing the perceived match for ATS systems, recruiters, HR managers, and company owners.

Do not generate a cover letter. The cover letter is handled separately.

First, identify the role's core requirements: job title, seniority level, responsibilities, must-have skills, nice-to-have skills, tools, technologies, industry/domain keywords, soft skills, and business outcomes expected from the candidate.

Then transform my CV honestly and strategically:

* Use the same or very close terminology from the job description where it matches my real experience.
* Adapt role titles, summaries, skills, and experience descriptions to align with the vacancy, but do not invent facts, employers, dates, tools, achievements, certifications, or experience I do not have.
* If my original job title can be clarified with a common market equivalent, include it naturally, for example "Head of IT / DevOps Engineer", but do not misrepresent my actual role.
* Do not add company-specific phrases inside the CV, such as direct references to the company name, its internal initiatives, or phrases like "highly relevant to [Company]'s new direction". The CV should be tailored to the role and job requirements, but still look reusable, natural, and professional.
* Prioritize only the experience, projects, technologies, achievements, and responsibilities that are relevant to this vacancy.
* Remove or greatly reduce anything unrelated to the vacancy.
* Compress older or less relevant experience into a short "Earlier Experience" section or summarize it briefly without detailed bullet points, unless that experience is directly important for the target role.
* Give the most space and detail to the most relevant recent roles, leadership experience, technical ownership, business impact, and role-specific achievements.
* Rewrite experience bullets to show concrete impact, ownership, scale, business value, technical stack, and measurable outcomes where supported by the source information.
* Include exact-match keywords from the job description naturally across the Summary, Skills, and Experience sections, avoiding keyword stuffing.
* Make the CV ATS-friendly: clean structure, standard section names, no tables, no graphics, no unnecessary formatting, and clear readable bullet points.

Before writing the final version, internally compare my profile against the vacancy and focus the CV on the strongest match areas. If something from my background does not support this specific application, omit it or reduce it significantly. The final output should feel human, professional, focused, and highly relevant to this exact role, not generic, over-personalized for one company, or obviously AI-generated.`

export const DEFAULT_MATCH_ASSESSMENT_PROMPT = `Analyze my original CV, contact details, and the full job description. Evaluate how well my profile matches this specific vacancy.

Your task is not to generate a CV or cover letter. Your task is to provide an honest, practical match assessment that helps me understand whether I am a strong candidate and what I should improve before applying.

First, identify the key requirements of the role: job title, seniority level, core responsibilities, must-have skills, nice-to-have skills, required technologies, domain experience, leadership expectations, soft skills, language requirements, and expected business outcomes.

Then compare these requirements against my real CV and provide:

1. Overall Match Score: give a score from 0 to 10, where:

* 9–10 means excellent match with only minor gaps
* 7–8 means strong match but with some noticeable gaps
* 5–6 means partial match; possible but requires careful positioning
* 3–4 means weak match with major gaps
* 0–2 means not suitable for this role

2. Short Verdict: explain in 2–4 sentences whether I should apply and why.

3. Strong Match Areas: list the parts of my background that clearly match the vacancy, such as relevant roles, leadership experience, technical skills, domain knowledge, achievements, scale, ownership, or business impact.

4. Weak Match Areas / Risks: list the gaps, missing experience, weak signals, or possible concerns a recruiter, hiring manager, ATS system, or company owner may notice.

5. Missing or Underrepresented Keywords: identify important keywords, skills, technologies, responsibilities, or domain terms from the job description that are missing or not clearly visible in my CV.

6. CV Improvement Suggestions: explain what should be emphasized, reduced, renamed, reorganized, or rewritten in my CV to improve the match honestly without inventing facts.

7. Interview Preparation Focus: list the topics I should be ready to explain in an interview to compensate for gaps or strengthen my positioning.

Be honest and specific. Do not exaggerate my fit. Do not invent skills, achievements, employers, dates, technologies, certifications, or experience I do not have. If something is not proven by my CV, mark it as a gap or as something that needs clarification. Focus on practical hiring relevance, ATS matching, recruiter perception, and whether my experience can realistically support this role.`

export const PRESET_MODELS = [
  'gpt-5.5',
  'gpt-5.4',
  'gpt-5.4-mini',
  'gpt-5.4-nano-2026-03-17',
  'gpt-5-nano-2025-08-07',
  'gpt-4o-mini-2024-07-18',
] as const

export const DEFAULT_MATCH_ASSESSMENT_MODEL = 'gpt-4o-mini-2024-07-18'

export const DEFAULT_MAX_OUTPUT_TOKENS = 4096

export const MAX_OUTPUT_TOKENS_HINT =
  '4096 — fine for most job applications. Raise it – e.g. 8192 if CV + long cover letter + extra sections aren\'t enough.'

export const DEFAULT_SETTINGS: ExtensionSettings = {
  openAiApiKey: '',
  coverLetter: '',
  openAiApiUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
  matchAssessmentModel: DEFAULT_MATCH_ASSESSMENT_MODEL,
  cvFilePath: '',
  cvContent: '',
  themeMode: 'auto',
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  matchAssessmentPrompt: DEFAULT_MATCH_ASSESSMENT_PROMPT,
  maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
  avatarFilePath: '',
  avatarDataUrl: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  linkedIn: '',
  telegram: '',
  website: '',
}

export const SETTINGS_STORAGE_KEY = 'cv-match-settings'

export const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  auto: 'System',
  light: 'Light',
  dark: 'Dark',
}
