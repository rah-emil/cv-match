export const MAX_JOB_TEXT_LENGTH = 12000

export const JOB_DESCRIPTION_SELECTORS = [
  '[class*="job-description"]',
  '[class*="jobDescription"]',
  '[class*="vacancy"]',
  '[class*="posting"]',
  '[data-testid*="job"]',
  '[id*="job-description"]',
  '[id*="jobDescription"]',
  'article',
  'main',
  '[role="main"]',
] as const

export const MIN_MANUAL_JOB_TEXT_LENGTH = 50

export function truncateJobText(text: string): string {
  if (text.length <= MAX_JOB_TEXT_LENGTH) return text
  return `${text.substring(0, MAX_JOB_TEXT_LENGTH)}\n...[truncated]`
}

export function extractTextFromElement(element: Element): string {
  return (element.textContent ?? '').trim()
}

export function extractJobTextAutomatically(): string {
  for (const selector of JOB_DESCRIPTION_SELECTORS) {
    const element = document.querySelector(selector)
    if (
      element &&
      extractTextFromElement(element).length > 100
    ) {
      return truncateJobText(extractTextFromElement(element))
    }
  }

  return truncateJobText(document.body.innerText.trim())
}
