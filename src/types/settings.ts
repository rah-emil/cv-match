import type { AiProvider } from './aiProviders'
import { AI_PROVIDER_CONFIGS } from './aiProviders'

export type ThemeMode = 'auto' | 'light' | 'dark'

export interface ExtensionSettings {
  aiProvider: AiProvider
  openAiApiKey: string
  coverLetter: string
  openAiApiUrl: string
  model: string
  matchAssessmentModel: string
  cvFilePath: string
  cvContent: string
  cvContext: string
  cvNotes: string
  themeMode: ThemeMode
  systemPrompt: string
  matchAssessmentPrompt: string
  coverLetterPrompt: string
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

export const DEFAULT_SYSTEM_PROMPT = `Analyze my original CV, contact details, and the full job description. Generate a tailored CV optimized for this specific vacancy, with the goal of maximizing the perceived match for ATS systems, recruiters, HR managers, hiring managers, and company owners.

Do not generate a cover letter. The cover letter is handled separately.

First, identify the role's core requirements: job title, seniority level, responsibilities, must-have skills, nice-to-have skills, tools, technologies, industry/domain keywords, soft skills, leadership expectations, and expected business outcomes.

Then generate the CV using this structure:

1. Header
   Include my name, location, contact details, LinkedIn, and other relevant links if available. Keep it clean and ATS-friendly.

2. Target Title / Positioning Line
   Create a concise professional headline aligned with the vacancy, using honest market positioning based on my real experience. Do not overstate my role.

3. Professional Summary
   Write 3–5 concise lines explaining who I am professionally, my level, relevant domains, strongest experience, and why my background matches the target role. Do not mention the specific company name in the CV.

4. Core Skills / Key Competencies
   Create an ATS-friendly skills section grouped by category. Use relevant keywords from the job description only where they match my real experience. Avoid keyword stuffing.

5. Selected Achievements / Role Match Highlights
   Add 4–6 bullet points showing the strongest evidence that I match the role: leadership, team scaling, architecture, product delivery, ownership, business impact, technical strategy, measurable outcomes, or domain-specific achievements. Use numbers where supported by my original CV.

6. Professional Experience
   List my experience in reverse chronological order. Give the most space and detail to the most recent and most relevant roles. Rewrite bullets to show ownership, scale, impact, technical stack, leadership, business value, and outcomes where supported by the source information.

7. Earlier Experience
   Compress older or less relevant roles into a short section with minimal detail. Do not include long descriptions of old web-development, freelance, or unrelated experience unless it directly supports this specific vacancy.

8. Education / Certifications
   Include only if available and relevant. Do not invent anything.

9. Languages
   Include language skills if available or if the job description requires them.

10. Optional Relevant Projects / AI & Data Initiatives
    Include this section only if the original CV or provided materials contain real relevant projects. Do not invent AI, ML, data, cloud, or engineering projects.

Transformation rules:

* Use the same or very close terminology from the job description where it matches my real experience.
* Adapt role titles, summaries, skills, and experience descriptions to align with the vacancy, but do not invent facts, employers, dates, tools, achievements, certifications, or experience I do not have.
* If my original job title can be clarified with a common market equivalent, include it naturally, for example "Head of IT / DevOps Engineer", but do not misrepresent my actual role.
* Do not add company-specific phrases inside the CV, such as direct references to the company name, its internal initiatives, or phrases like "highly relevant to [Company]'s new direction". The CV should be tailored to the role and job requirements, but still look reusable, natural, and professional.
* Prioritize only the experience, projects, technologies, achievements, and responsibilities that are relevant to this vacancy.
* Remove or greatly reduce anything unrelated to the vacancy.
* Rewrite experience bullets to show concrete impact, ownership, scale, business value, technical stack, and measurable outcomes where supported by the source information.
* Include exact-match keywords from the job description naturally across the Summary, Skills, Achievements, and Experience sections.
* Make the CV ATS-friendly: clean structure, standard section names, no tables, no graphics, no columns, no unnecessary formatting, and clear readable bullet points.

Before writing the final version, internally compare my profile against the vacancy and focus the CV on the strongest match areas. If something from my background does not support this specific application, omit it or reduce it significantly. The final output should feel human, professional, focused, and highly relevant to this exact role, not generic, over-personalized for one company, or obviously AI-generated.
`

export const DEFAULT_MATCH_ASSESSMENT_PROMPT = `Analyze my original CV, contact details, and the full job description. Evaluate how well my profile matches this specific vacancy.

Your task is not to generate a CV or cover letter. Your task is to give a very short, practical hiring-relevance verdict.

Do not repeat what I already know how to do. Do not list my strengths unless they are needed to explain why I am a good match. Focus on gaps, mismatch, and whether applying makes sense.

First, internally identify the key requirements of the role: seniority level, core responsibilities, must-have skills, required technologies, domain experience, leadership expectations, language requirements, and expected business outcomes.

Then compare these requirements against my real CV and give:

1. Overall Match Score: a score from 0 to 10, where:

* 9–10 means excellent match with only minor gaps
* 7–8 means strong match but with some noticeable gaps
* 5–6 means partial match; possible but requires careful positioning
* 3–4 means weak match with major gaps
* 0–2 means not suitable for this role

2. Verdict:

* If I clearly do not fit: say briefly why I do not fit.
* If I fit well: say briefly why I fit.
* If I almost fit or partially fit: list only the mismatch areas and missing signals.

Keep the response very short: 3–6 bullet points maximum after the score. Be direct, specific, and simple. Do not include long explanations, praise, generic advice, CV rewriting tips, interview preparation, or repeated descriptions of my strengths.

Do not invent skills, achievements, employers, dates, technologies, certifications, or experience. If something is not proven by my CV, treat it as a gap or a missing signal.`

export const DEFAULT_COVER_LETTER_PROMPT = `Analyze my CV, contact details, and the full job description. Generate a short, tailored cover letter for this specific vacancy.

The cover letter must be concise, natural, and professional. Avoid generic phrases, clichés, exaggerated enthusiasm, and empty statements such as "I am passionate about", "I am the perfect fit", or "I am excited to apply".

Focus only on the strongest reasons why my real experience matches this role. Mention the company and role naturally, but do not over-personalize or repeat the job description. Highlight 2–3 relevant strengths from my CV, such as leadership, technical ownership, business impact, domain experience, team building, architecture, product delivery, or other skills that match the vacancy.

Do not invent facts, achievements, technologies, employers, dates, or experience. If something is not clearly supported by my CV, do not include it.

The final letter should be no longer than 150–220 words, easy to read, human-sounding, and suitable to send together with my CV.`

export const DEFAULT_CV_ANALYSIS_PROMPT = `You will receive the raw, automatically extracted text of a candidate's CV/resume.

Your task is to distill it into a compact, reusable context that will later be used to generate strong, tailored CVs and cover letters for many different job postings.

Respond with ONE valid JSON object and nothing else, using exactly these fields:
{"cvContext": "...", "notes": "...", "profile": {"firstName": "", "lastName": "", "email": "", "phone": "", "linkedIn": "", "telegram": "", "website": ""}}

- cvContext: a concise but complete summary written in clear English. It must describe:
  * what the candidate can do (core capabilities and domains),
  * their professional experience and seniority level,
  * the roles and positions they have held,
  * a full chronological career timeline with exact dates for every role, project period, and education entry — this is mandatory. List experience in reverse chronological order. For each item include: job title, company/organization, start date, end date (or "Present"), and approximate duration if dates are partial (for example: "Jan 2021 – Mar 2024 (3 years)"). Never omit dates when they appear in the CV. If only a year is given, use that year. If dates are truly absent in the source, write "dates not specified" for that entry and mention the gap in notes.
  * and a full list of all their skills — technologies, tools, soft skills, and spoken languages — listed exhaustively (for example as a "Skills: a, b, c" line) so nothing important is lost.
  Structure cvContext with clear sections, including at minimum: "Career timeline" (with dates), "Skills", and a short "Summary". The timeline section is required and must not be skipped.
  Only use information supported by the CV text. Do not invent dates, employers, or roles.

- notes: a short, candid summary of what is missing, unclear, or weak in the CV that would make it hard to generate high-quality tailored CVs across different roles (for example: missing quantified results/metrics, unclear or missing dates, no seniority signals, missing contact details, vague responsibilities, no language proficiency levels). If nothing important is missing, return an empty string.

- profile: contact details extracted from the CV, used to auto-fill the candidate's profile. Each field MUST be a string:
  * firstName, lastName: the candidate's given and family name.
  * email: primary email address.
  * phone: phone number, including country code if present.
  * linkedIn: LinkedIn profile URL or handle.
  * telegram: Telegram handle (for example "@username").
  * website: personal website or portfolio URL.
  For any field that is not clearly present in the CV, return an empty string "". Do not invent or guess contact details.

Do not wrap the JSON in code fences. Do not output anything before or after the JSON object.`

export const DEFAULT_MATCH_ASSESSMENT_MODEL =
  AI_PROVIDER_CONFIGS.openai.defaultTaskModel

export const DEFAULT_MAX_OUTPUT_TOKENS = 4096

export const MAX_OUTPUT_TOKENS_HINT =
  '4096 — fine for most job applications. Raise it – e.g. 8192 if CV + long cover letter + extra sections aren\'t enough.'

export const DEFAULT_SETTINGS: ExtensionSettings = {
  aiProvider: 'openai',
  openAiApiKey: '',
  coverLetter: '',
  openAiApiUrl: 'https://api.openai.com/v1',
  model: AI_PROVIDER_CONFIGS.openai.defaultCvModel,
  matchAssessmentModel: DEFAULT_MATCH_ASSESSMENT_MODEL,
  cvFilePath: '',
  cvContent: '',
  cvContext: '',
  cvNotes: '',
  themeMode: 'auto',
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  matchAssessmentPrompt: DEFAULT_MATCH_ASSESSMENT_PROMPT,
  coverLetterPrompt: DEFAULT_COVER_LETTER_PROMPT,
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
