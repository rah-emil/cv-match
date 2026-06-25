import { describe, expect, it } from 'vitest'
import { Window } from 'happy-dom'
import { matchInputToProfileField } from './autoFillProfile'
import { collectAutofillSignalTexts } from './collectAutofillSignals'

describe('collectAutofillSignals', () => {
  it('finds sibling label text for generic question_* fields', () => {
    const window = new Window()
    const document = window.document

    document.body.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label>Telegram</label>
        <div>
          <input id="field-question_14950806008" type="text" name="question_14950806008" value="">
        </div>
      </div>
    `

    const input = document.querySelector('input')
    expect(input).not.toBeNull()
    const signals = collectAutofillSignalTexts(input as unknown as HTMLElement)

    expect(matchInputToProfileField(signals)).toBe('telegram')
  })

  it('finds label linked with for attribute', () => {
    const window = new Window()
    const document = window.document

    document.body.innerHTML = `
      <label for="email-input">Work email</label>
      <input id="email-input" type="email" name="question_123" />
    `

    const input = document.querySelector('input')
    expect(input).not.toBeNull()
    expect(matchInputToProfileField(collectAutofillSignalTexts(input as unknown as HTMLElement))).toBe('email')
  })
})
