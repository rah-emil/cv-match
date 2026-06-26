import { describe, expect, it, beforeEach } from 'vitest'
import { storageData } from '../test/setup'
import {
  clearGeneratedContent,
  EMPTY_GENERATED_CONTENT,
  GENERATED_CONTENT_STORAGE_KEY,
  loadGeneratedContent,
  saveGeneratedContent,
} from './generatedContentStorage'

describe('generatedContentStorage', () => {
  beforeEach(() => {
    delete storageData[GENERATED_CONTENT_STORAGE_KEY]
  })

  it('returns empty defaults when storage is empty', async () => {
    await expect(loadGeneratedContent()).resolves.toEqual(EMPTY_GENERATED_CONTENT)
  })

  it('loads previously saved generated content', async () => {
    storageData[GENERATED_CONTENT_STORAGE_KEY] = {
      cvResult: '# Jane Doe',
      coverLetterResult: 'Dear team...',
      matchComment: 'Strong fit',
      matchResult: 'Overall Match Score: 8/10',
    }

    await expect(loadGeneratedContent()).resolves.toEqual({
      cvResult: '# Jane Doe',
      coverLetterResult: 'Dear team...',
      matchComment: 'Strong fit',
      matchResult: 'Overall Match Score: 8/10',
    })
  })

  it('persists and clears generated content', async () => {
    await saveGeneratedContent({
      cvResult: 'CV text',
      coverLetterResult: 'Letter',
      matchComment: 'Notes',
      matchResult: '',
    })

    expect(storageData[GENERATED_CONTENT_STORAGE_KEY]).toEqual({
      cvResult: 'CV text',
      coverLetterResult: 'Letter',
      matchComment: 'Notes',
      matchResult: '',
    })

    await clearGeneratedContent()
    await expect(loadGeneratedContent()).resolves.toEqual(EMPTY_GENERATED_CONTENT)
  })
})
