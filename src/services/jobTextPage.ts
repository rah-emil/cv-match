export type JobTextSource = 'manual' | 'auto' | null

export interface JobTextSelection {
  text: string | null
  source: JobTextSource
  charCount: number
  pickerActive: boolean
}

async function getActiveTabId(): Promise<number> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) throw new Error('No active tab found')
  return tab.id
}

function formatContentScriptError(error: unknown): string {
  const message = (error as Error).message
  if (message.includes('Receiving end does not exist')) {
    return 'Reload the page and try again'
  }
  return message
}

export async function queryJobTextSelection(): Promise<JobTextSelection> {
  try {
    const tabId = await getActiveTabId()
    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'getJobTextSelection',
    })

    return {
      text: response?.text?.trim() || null,
      source: response?.source ?? null,
      charCount: response?.charCount ?? 0,
      pickerActive: Boolean(response?.pickerActive),
    }
  } catch (error) {
    throw new Error(formatContentScriptError(error))
  }
}

export async function startJobTextPickerOnPage(): Promise<void> {
  try {
    const tabId = await getActiveTabId()
    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'startJobTextPicker',
    })
    if (response?.error) throw new Error(response.error)
  } catch (error) {
    throw new Error(formatContentScriptError(error))
  }
}

export async function clearJobTextSelectionOnPage(): Promise<void> {
  try {
    const tabId = await getActiveTabId()
    await chrome.tabs.sendMessage(tabId, { action: 'clearJobTextSelection' })
  } catch (error) {
    throw new Error(formatContentScriptError(error))
  }
}

export async function extractJobTextFromActivePage(): Promise<{
  text: string
  source: Exclude<JobTextSource, null>
}> {
  try {
    const tabId = await getActiveTabId()
    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'extractJobText',
    })

    if (response?.error) throw new Error(response.error)
    if (!response?.text?.trim()) {
      throw new Error('Could not extract job text from the page')
    }

    return {
      text: response.text,
      source: response.source === 'manual' ? 'manual' : 'auto',
    }
  } catch (error) {
    throw new Error(formatContentScriptError(error))
  }
}
