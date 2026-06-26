import {
  cancelJobTextPicker,
  isJobTextPickerActive,
  startJobTextPicker,
} from './jobTextPicker'
import { extractJobTextAutomatically } from '../utils/jobTextExtraction'

type ExtractJobTextResponse = {
  text?: string
  error?: string
  source?: 'manual' | 'auto'
}

type JobTextSelectionResponse = {
  text?: string
  source?: 'manual' | 'auto' | null
  charCount?: number
  pickerActive?: boolean
  error?: string
}

type PickerActionResponse = {
  started?: boolean
  cancelled?: boolean
  error?: string
}

let manualJobText: string | null = null

function resolveJobText(): ExtractJobTextResponse {
  if (manualJobText?.trim()) {
    return { text: manualJobText, source: 'manual' }
  }

  return { text: extractJobTextAutomatically(), source: 'auto' }
}

chrome.runtime.onMessage.addListener(
  (
    request: { action: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (
      response:
        | ExtractJobTextResponse
        | JobTextSelectionResponse
        | PickerActionResponse,
    ) => void,
  ) => {
    try {
      if (request.action === 'extractJobText') {
        sendResponse(resolveJobText())
        return true
      }

      if (request.action === 'getJobTextSelection') {
        sendResponse({
          text: manualJobText ?? undefined,
          source: manualJobText ? 'manual' : null,
          charCount: manualJobText?.length ?? 0,
          pickerActive: isJobTextPickerActive(),
        })
        return true
      }

      if (request.action === 'clearJobTextSelection') {
        manualJobText = null
        cancelJobTextPicker()
        sendResponse({ cancelled: true })
        return true
      }

      if (request.action === 'startJobTextPicker') {
        if (isJobTextPickerActive()) {
          sendResponse({ started: true })
          return true
        }

        startJobTextPicker(
          (text) => {
            manualJobText = text
          },
          () => {
            manualJobText = manualJobText ?? null
          },
        )
        sendResponse({ started: true })
        return true
      }

      if (request.action === 'cancelJobTextPicker') {
        cancelJobTextPicker()
        sendResponse({ cancelled: true })
        return true
      }
    } catch (error) {
      sendResponse({ error: (error as Error).message })
      return true
    }

    return false
  },
)
