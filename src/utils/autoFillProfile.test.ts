import { describe, expect, it } from 'vitest'
import {
  buildAutofillValues,
  extractAutofillProfile,
  formatTelegramForForm,
  getMissingRequiredProfileFields,
  matchInputToProfileField,
  normalizeLinkedIn,
} from './autoFillProfile'

describe('autoFillProfile', () => {
  it('matches common input names to profile fields', () => {
    expect(matchInputToProfileField(['first_name'])).toBe('firstName')
    expect(matchInputToProfileField(['email-address'])).toBe('email')
    expect(matchInputToProfileField(['linkedin-url'])).toBe('linkedIn')
    expect(matchInputToProfileField(['random-field'])).toBeNull()
  })

  it('returns missing required profile fields', () => {
    expect(
      getMissingRequiredProfileFields({
        firstName: '',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '',
        linkedIn: '',
        telegram: '',
        website: '',
      }),
    ).toEqual(['First name'])
  })

  it('normalizes social links for autofill', () => {
    const values = buildAutofillValues({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '',
      linkedIn: 'janedoe',
      telegram: '@jane',
      website: 'janedoe.dev',
    })

    expect(values.linkedIn).toBe('https://www.linkedin.com/in/janedoe')
    expect(values.telegram).toBe('@jane')
    expect(values.website).toBe('https://janedoe.dev')
  })

  it('formats telegram for text inputs', () => {
    expect(formatTelegramForForm('jane')).toBe('@jane')
    expect(formatTelegramForForm('https://t.me/jane')).toBe('@jane')
    expect(formatTelegramForForm('@jane')).toBe('@jane')
  })

  it('extracts autofill payload from settings', () => {
    const profile = extractAutofillProfile({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '+1 555',
      linkedIn: normalizeLinkedIn('linkedin.com/in/jane'),
      telegram: '@jane',
      website: 'https://jane.dev',
    })

    expect(profile.firstName).toBe('Jane')
    expect(profile.email).toBe('jane@example.com')
  })
})
