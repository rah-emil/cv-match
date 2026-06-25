import {
  buildAutofillValues,
  matchInputToProfileField,
  type ProfileAutofillData,
  type ProfileFieldKey,
} from '../utils/autoFillProfile'
import { collectAutofillSignalTexts } from '../utils/collectAutofillSignals'

export interface AutofillResult {
  filledCount: number
  filledFields: ProfileFieldKey[]
}

function isFillableInput(
  element: HTMLInputElement | HTMLTextAreaElement,
): boolean {
  if (element.disabled || element.readOnly) return false

  if (element instanceof HTMLInputElement) {
    const blockedTypes = new Set([
      'hidden',
      'submit',
      'button',
      'reset',
      'checkbox',
      'radio',
      'file',
      'password',
    ])
    if (blockedTypes.has(element.type)) return false
  }

  return true
}

function setNativeValue(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string,
): void {
  const proto =
    element instanceof HTMLInputElement
      ? HTMLInputElement.prototype
      : HTMLTextAreaElement.prototype
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value')
  descriptor?.set?.call(element, value)
  element.dispatchEvent(new Event('input', { bubbles: true }))
  element.dispatchEvent(new Event('change', { bubbles: true }))
}

export function autoFillFormFields(profile: ProfileAutofillData): AutofillResult {
  const values = buildAutofillValues(profile)
  const filledFields = new Set<ProfileFieldKey>()
  const elements = document.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement
  >('input, textarea')

  for (const element of elements) {
    if (!isFillableInput(element)) continue
    if (element.value.trim()) continue

    const field = matchInputToProfileField(collectAutofillSignalTexts(element))
    if (!field) continue

    const value = values[field]
    if (!value) continue

    setNativeValue(element, value)
    filledFields.add(field)
  }

  return {
    filledCount: filledFields.size,
    filledFields: [...filledFields],
  }
}

chrome.runtime.onMessage.addListener(
  (
    request: { action: string; profile?: ProfileAutofillData },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: {
      filledCount?: number
      filledFields?: ProfileFieldKey[]
      error?: string
    }) => void,
  ) => {
    if (request.action !== 'autoFillForm') return false

    try {
      if (!request.profile) {
        sendResponse({ error: 'Profile data is missing' })
        return true
      }

      const result = autoFillFormFields(request.profile)
      sendResponse(result)
    } catch (e) {
      sendResponse({ error: (e as Error).message })
    }

    return true
  },
)
