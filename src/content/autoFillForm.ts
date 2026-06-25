import {
  buildAutofillValues,
  matchInputToProfileField,
  type ProfileAutofillData,
  type ProfileFieldKey,
} from '../utils/autoFillProfile'

export interface AutofillResult {
  filledCount: number
  filledFields: ProfileFieldKey[]
}

function collectInputSignals(element: HTMLInputElement | HTMLTextAreaElement): string[] {
  const parts: string[] = []

  if (element.name) parts.push(element.name)
  if (element.id) parts.push(element.id)
  if (element.autocomplete) parts.push(element.autocomplete)
  if (element.placeholder) parts.push(element.placeholder)
  if (element.getAttribute('aria-label')) {
    parts.push(element.getAttribute('aria-label')!)
  }
  if (element.getAttribute('data-testid')) {
    parts.push(element.getAttribute('data-testid')!)
  }

  const doc = element.ownerDocument
  if (element.id) {
    const label = doc.querySelector(`label[for="${CSS.escape(element.id)}"]`)
    if (label?.textContent) parts.push(label.textContent)
  }

  const parentLabel = element.closest('label')
  if (parentLabel?.textContent) parts.push(parentLabel.textContent)

  return parts
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

    const field = matchInputToProfileField(collectInputSignals(element))
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
