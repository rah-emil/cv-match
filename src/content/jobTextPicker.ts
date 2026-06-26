import {
  extractTextFromElement,
  MIN_MANUAL_JOB_TEXT_LENGTH,
  truncateJobText,
} from '../utils/jobTextExtraction'

const PICKER_ROOT_ID = 'cv-match-job-text-picker'
const HIGHLIGHT_CLASS = 'cv-match-job-text-picker__highlight'
const TOAST_ID = 'cv-match-job-text-picker-toast'

let activePicker: { cleanup: () => void } | null = null

export function isJobTextPickerActive(): boolean {
  return activePicker !== null
}

export function cancelJobTextPicker(): void {
  activePicker?.cleanup()
  activePicker = null
}

function showToast(message: string, durationMs = 2200): void {
  let toast = document.getElementById(TOAST_ID) as HTMLDivElement | null
  if (!toast) {
    toast = document.createElement('div')
    toast.id = TOAST_ID
    toast.innerHTML = `
      <style>
        #${TOAST_ID} {
          all: initial;
          pointer-events: none;
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          max-width: min(420px, calc(100vw - 32px));
          padding: 10px 14px;
          border-radius: 8px;
          background: #141414 !important;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          font: 500 13px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          text-align: center;
          opacity: 0;
          transition: opacity 0.2s ease;
          z-index: 2147483647;
          color-scheme: only light;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28);
        }

        #${TOAST_ID}.is-visible {
          opacity: 1;
        }
      </style>
      <span class="cv-match-job-text-picker__toast-text"></span>
    `
    document.documentElement.appendChild(toast)
  }

  const label = toast.querySelector('.cv-match-job-text-picker__toast-text')
  if (label) {
    label.textContent = message
  }

  toast.classList.add('is-visible')
  window.setTimeout(() => {
    toast?.classList.remove('is-visible')
  }, durationMs)
}

export function startJobTextPicker(
  onSelect: (text: string) => void,
  onCancel: () => void,
): void {
  cancelJobTextPicker()

  const root = document.createElement('div')
  root.id = PICKER_ROOT_ID
  root.innerHTML = `
    <style>
      #${PICKER_ROOT_ID} {
        all: initial;
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        pointer-events: none;
        color-scheme: only light;
      }

      #${PICKER_ROOT_ID} .cv-match-job-text-picker__banner {
        pointer-events: auto;
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        max-width: min(560px, calc(100vw - 32px));
        padding: 12px 16px;
        border-radius: 10px;
        background: #141414 !important;
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
        font: 500 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
        text-align: center;
      }

      #${PICKER_ROOT_ID} .cv-match-job-text-picker__banner strong {
        display: block;
        margin-bottom: 4px;
        font-size: 15px;
        font-weight: 600;
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }

      .${HIGHLIGHT_CLASS} {
        outline: 2px solid #2f54eb !important;
        outline-offset: 2px !important;
        background-color: rgba(47, 84, 235, 0.08) !important;
        cursor: crosshair !important;
      }
    </style>
    <div class="cv-match-job-text-picker__banner">
      <strong>Select job description</strong>
      Click the vacancy text on the page. Press Esc to cancel.
    </div>
  `

  document.documentElement.appendChild(root)

  let highlighted: HTMLElement | null = null

  const clearHighlight = () => {
    highlighted?.classList.remove(HIGHLIGHT_CLASS)
    highlighted = null
  }

  const resolveTarget = (element: Element | null): HTMLElement | null => {
    if (!(element instanceof HTMLElement)) return null
    if (element.closest(`#${PICKER_ROOT_ID}, #${TOAST_ID}`)) {
      return null
    }

    let current: HTMLElement | null = element
    while (current && current !== document.body && current !== document.documentElement) {
      const text = extractTextFromElement(current)
      if (text.length >= MIN_MANUAL_JOB_TEXT_LENGTH) {
        return current
      }
      current = current.parentElement
    }

    return element instanceof HTMLElement ? element : null
  }

  const highlight = (element: HTMLElement) => {
    clearHighlight()
    highlighted = element
    highlighted.classList.add(HIGHLIGHT_CLASS)
  }

  const onMouseMove = (event: MouseEvent) => {
    const target = resolveTarget(document.elementFromPoint(event.clientX, event.clientY))
    if (!target || target === highlighted) return
    highlight(target)
  }

  const onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0) return
    if ((event.target as Element | null)?.closest(`#${PICKER_ROOT_ID}, #${TOAST_ID}`)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()

    const target =
      highlighted ??
      resolveTarget(document.elementFromPoint(event.clientX, event.clientY))
    if (!target) return

    const text = truncateJobText(extractTextFromElement(target))
    if (text.length < MIN_MANUAL_JOB_TEXT_LENGTH) {
      showToast('Selected block is too short. Pick a larger section.')
      return
    }

    cleanup()
    onSelect(text)
    showToast(
      `Selected · ${text.length.toLocaleString()} characters. Reopen CV Match to continue.`,
      3200,
    )
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    cleanup()
    onCancel()
  }

  const cleanup = () => {
    clearHighlight()
    document.removeEventListener('mousemove', onMouseMove, true)
    document.removeEventListener('mousedown', onMouseDown, true)
    document.removeEventListener('keydown', onKeyDown, true)
    root.remove()
    activePicker = null
  }

  document.addEventListener('mousemove', onMouseMove, true)
  document.addEventListener('mousedown', onMouseDown, true)
  document.addEventListener('keydown', onKeyDown, true)

  activePicker = { cleanup }
}
