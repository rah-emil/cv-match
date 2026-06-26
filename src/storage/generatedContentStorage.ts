export const GENERATED_CONTENT_STORAGE_KEY = 'cv-match-generated-content'

export interface StoredGeneratedContent {
  cvResult: string
  coverLetterResult: string
  matchComment: string
  matchResult: string
}

export const EMPTY_GENERATED_CONTENT: StoredGeneratedContent = {
  cvResult: '',
  coverLetterResult: '',
  matchComment: '',
  matchResult: '',
}

function getLocalStorage() {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    throw new Error(
      'Chrome storage is unavailable. Open the popup from the installed extension.',
    )
  }

  return chrome.storage.local
}

function mergeWithDefaults(
  stored: Partial<StoredGeneratedContent> | undefined,
): StoredGeneratedContent {
  return {
    ...EMPTY_GENERATED_CONTENT,
    ...stored,
  }
}

export async function loadGeneratedContent(): Promise<StoredGeneratedContent> {
  const result = await getLocalStorage().get(GENERATED_CONTENT_STORAGE_KEY)
  const stored = result[GENERATED_CONTENT_STORAGE_KEY] as
    | Partial<StoredGeneratedContent>
    | undefined
  return mergeWithDefaults(stored)
}

export async function saveGeneratedContent(
  content: StoredGeneratedContent,
): Promise<void> {
  await getLocalStorage().set({ [GENERATED_CONTENT_STORAGE_KEY]: content })
}

export async function clearGeneratedContent(): Promise<void> {
  await saveGeneratedContent(EMPTY_GENERATED_CONTENT)
}
