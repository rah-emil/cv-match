chrome.runtime.onMessage.addListener(
  (
    request: { action: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: { text?: string; error?: string }) => void,
  ) => {
    if (request.action !== 'extractJobText') return false

    try {
      const selectors = [
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
      ]

      let text = ''

      for (const selector of selectors) {
        const el = document.querySelector(selector)
        if (el?.textContent && el.textContent.trim().length > 100) {
          text = el.textContent.trim()
          break
        }
      }

      if (!text) {
        text = document.body.innerText
      }

      const maxLen = 12000
      if (text.length > maxLen) {
        text = text.substring(0, maxLen) + '\n...[truncated]'
      }

      sendResponse({ text })
    } catch (e) {
      sendResponse({ error: (e as Error).message })
    }

    return true
  },
)
