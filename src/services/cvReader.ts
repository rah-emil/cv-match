const MAX_CHARS = 40_000

export type SupportedFormat = 'txt' | 'md' | 'pdf' | 'docx' | 'doc'

export interface CvReadResult {
  text: string
  fileName: string
  format: SupportedFormat
}

export function getSupportedFormat(fileName: string): SupportedFormat | null {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const supported: SupportedFormat[] = ['txt', 'md', 'pdf', 'docx', 'doc']
  return supported.includes(ext as SupportedFormat)
    ? (ext as SupportedFormat)
    : null
}

export async function readCvFile(file: File): Promise<CvReadResult> {
  const format = getSupportedFormat(file.name)
  if (!format) {
    throw new Error(
      `Unsupported file format. Please use: .pdf, .docx, .doc, .md, .txt`,
    )
  }

  let text: string

  switch (format) {
    case 'txt':
    case 'md':
      text = await readAsText(file)
      break
    case 'pdf':
      text = await readPdf(file)
      break
    case 'docx':
    case 'doc':
      text = await readDocx(file)
      break
  }

  text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()

  if (text.length > MAX_CHARS) {
    text = text.substring(0, MAX_CHARS) + '\n...[truncated]'
  }

  return { text, fileName: file.name, format }
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file, 'UTF-8')
  })
}

async function readPdf(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')

  // Use bundled worker from pdfjs-dist
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: arrayBuffer }).promise
  const parts: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    parts.push(pageText)
  }

  return parts.join('\n\n')
}

async function readDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}
