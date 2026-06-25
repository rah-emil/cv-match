export interface ProfileAutofillData {
  firstName: string
  lastName: string
  email: string
  phone: string
  linkedIn: string
  telegram: string
  website: string
}

export type ProfileFieldKey = keyof ProfileAutofillData

const FIELD_TOKENS: Record<ProfileFieldKey, string[]> = {
  firstName: [
    'firstname',
    'first-name',
    'first_name',
    'fname',
    'givenname',
    'given-name',
    'namefirst',
  ],
  lastName: [
    'lastname',
    'last-name',
    'last_name',
    'lname',
    'surname',
    'familyname',
    'family-name',
    'namelast',
  ],
  email: ['email', 'emailaddress', 'e-mail', 'mail'],
  phone: ['phone', 'tel', 'mobile', 'telephone', 'cellphone', 'phonenumber'],
  linkedIn: ['linkedin', 'linkedinprofile', 'linkedinurl'],
  telegram: ['telegram', 'telegramusername', 'tg'],
  website: ['website', 'portfolio', 'personalsite', 'homepage', 'siteurl'],
}

export function normalizeProfileFieldKey(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function matchInputToProfileField(parts: string[]): ProfileFieldKey | null {
  const normalized = parts
    .map((part) => normalizeProfileFieldKey(part))
    .filter(Boolean)

  for (const [field, tokens] of Object.entries(FIELD_TOKENS) as [
    ProfileFieldKey,
    string[],
  ][]) {
    if (
      normalized.some((part) =>
        tokens.some((token) => part === token || part.includes(token)),
      )
    ) {
      return field
    }
  }

  return null
}

export function normalizeLinkedIn(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('linkedin.com')) return `https://${trimmed}`
  if (trimmed.startsWith('www.')) return `https://${trimmed}`
  return `https://www.linkedin.com/in/${trimmed.replace(/^\/+/, '')}`
}

export function normalizeWebsite(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function normalizeTelegram(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const handle = trimmed.replace(/^@/, '')
  return handle.includes('t.me') ? `https://${handle.replace(/^https?:\/\//, '')}` : `https://t.me/${handle}`
}

export function buildAutofillValues(
  profile: ProfileAutofillData,
): ProfileAutofillData {
  return {
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
    email: profile.email.trim(),
    phone: profile.phone.trim(),
    linkedIn: profile.linkedIn.trim() ? normalizeLinkedIn(profile.linkedIn) : '',
    telegram: profile.telegram.trim() ? normalizeTelegram(profile.telegram) : '',
    website: profile.website.trim() ? normalizeWebsite(profile.website) : '',
  }
}

export function getMissingRequiredProfileFields(profile: ProfileAutofillData): string[] {
  const missing: string[] = []
  if (!profile.firstName.trim()) missing.push('First name')
  if (!profile.lastName.trim()) missing.push('Last name')
  if (!profile.email.trim()) missing.push('Email')
  return missing
}

export function extractAutofillProfile(settings: {
  firstName: string
  lastName: string
  email: string
  phone: string
  linkedIn: string
  telegram: string
  website: string
}): ProfileAutofillData {
  return buildAutofillValues({
    firstName: settings.firstName,
    lastName: settings.lastName,
    email: settings.email,
    phone: settings.phone,
    linkedIn: settings.linkedIn,
    telegram: settings.telegram,
    website: settings.website,
  })
}

export function getFullName(profile: Pick<ProfileAutofillData, 'firstName' | 'lastName'>): string {
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim()
}
