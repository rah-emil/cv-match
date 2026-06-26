import type { jsPDF } from 'jspdf'
import RobotoRegularUrl from '@expo-google-fonts/roboto/400Regular/Roboto_400Regular.ttf?url'
import RobotoBoldUrl from '@expo-google-fonts/roboto/700Bold/Roboto_700Bold.ttf?url'
import RobotoItalicUrl from '@expo-google-fonts/roboto/400Regular_Italic/Roboto_400Regular_Italic.ttf?url'
import RobotoBoldItalicUrl from '@expo-google-fonts/roboto/700Bold_Italic/Roboto_700Bold_Italic.ttf?url'

export const CV_PDF_FONT = 'Roboto'
export const FALLBACK_PDF_FONT = 'helvetica'

interface FontVariant {
  vfsName: string
  url: string
  style: 'normal' | 'bold' | 'italic' | 'bolditalic'
}

const FONT_VARIANTS: FontVariant[] = [
  { vfsName: 'Roboto-Regular.ttf', url: RobotoRegularUrl, style: 'normal' },
  { vfsName: 'Roboto-Bold.ttf', url: RobotoBoldUrl, style: 'bold' },
  { vfsName: 'Roboto-Italic.ttf', url: RobotoItalicUrl, style: 'italic' },
  { vfsName: 'Roboto-BoldItalic.ttf', url: RobotoBoldItalicUrl, style: 'bolditalic' },
]

let base64Cache: Map<string, string> | null = null

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

async function loadFontBase64(): Promise<Map<string, string>> {
  if (base64Cache) return base64Cache

  const cache = new Map<string, string>()
  await Promise.all(
    FONT_VARIANTS.map(async (variant) => {
      const response = await fetch(variant.url)
      const buffer = await response.arrayBuffer()
      cache.set(variant.vfsName, arrayBufferToBase64(buffer))
    }),
  )

  base64Cache = cache
  return cache
}

/**
 * Registers a Unicode-capable font (Roboto, covers Latin + Cyrillic) so the
 * generated PDF contains real, selectable text in any common language.
 * Falls back to the built-in Helvetica if the font assets cannot be loaded.
 */
export async function registerCvPdfFont(pdf: jsPDF): Promise<string> {
  try {
    const cache = await loadFontBase64()

    for (const variant of FONT_VARIANTS) {
      const base64 = cache.get(variant.vfsName)
      if (!base64) continue
      pdf.addFileToVFS(variant.vfsName, base64)
      pdf.addFont(variant.vfsName, CV_PDF_FONT, variant.style)
    }

    return CV_PDF_FONT
  } catch {
    return FALLBACK_PDF_FONT
  }
}
