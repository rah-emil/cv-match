import { jsPDF } from 'jspdf'
import { marked } from 'marked'
import {
  defaultCvPdfFilename,
  type CvDocumentOptions,
} from '../templates/cvDocument'
import { registerCvPdfFont } from './pdfFont'

const PAGE_WIDTH_MM = 210
const CONTENT_LEFT_MM = 18
const CONTENT_RIGHT_MM = PAGE_WIDTH_MM - 18
const CONTENT_TOP_MM = 20
const CONTENT_BOTTOM_MM = 281
const HEADER_TITLE_Y_MM = 9
const HEADER_RULE_Y_MM = 12
const FOOTER_Y_MM = 289

const AVATAR_SIZE_MM = 22
const AVATAR_X_MM = CONTENT_RIGHT_MM - AVATAR_SIZE_MM
const AVATAR_BAND_BOTTOM_MM = CONTENT_TOP_MM + AVATAR_SIZE_MM + 4
const AVATAR_GUTTER_MM = 5

const COLORS = {
  body: '#434343',
  heading: '#141414',
  accent: '#2f54eb',
  strong: '#141414',
  link: '#2f54eb',
  muted: '#787878',
  rule: '#e3e3e3',
  quoteBar: '#d0d7f5',
}

export interface CvPdfOptions extends CvDocumentOptions {
  documentTitle?: string
}

interface TextStyle {
  bold: boolean
  italic: boolean
  link?: string
  code?: boolean
}

interface Word {
  text: string
  style: TextStyle
  isBreak?: boolean
}

interface RichTextOptions {
  sizePt: number
  lineHeightFactor: number
  color: string
  forceBold?: boolean
  indentMm?: number
  hangingIndentMm?: number
  prefix?: { text: string; bold?: boolean }
}

interface RenderContext {
  pdf: jsPDF
  font: string
  title: string
  hasAvatar: boolean
  y: number
  page: number
}

function ptToMm(pt: number): number {
  return (pt * 25.4) / 72
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return [r, g, b]
}

function setStroke(ctx: RenderContext, hex: string): void {
  const [r, g, b] = hexToRgb(hex)
  ctx.pdf.setDrawColor(r, g, b)
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&hellip;/g, '\u2026')
}

function applyFont(ctx: RenderContext, style: TextStyle, sizePt: number): void {
  if (style.code) {
    ctx.pdf.setFont('courier', style.bold ? 'bold' : 'normal')
  } else {
    const variant = style.bold
      ? style.italic
        ? 'bolditalic'
        : 'bold'
      : style.italic
        ? 'italic'
        : 'normal'
    ctx.pdf.setFont(ctx.font, variant)
  }
  ctx.pdf.setFontSize(sizePt)
}

function setColor(ctx: RenderContext, hex: string): void {
  const [r, g, b] = hexToRgb(hex)
  ctx.pdf.setTextColor(r, g, b)
}

function rightEdgeAt(ctx: RenderContext, y: number): number {
  if (ctx.hasAvatar && ctx.page === 1 && y < AVATAR_BAND_BOTTOM_MM) {
    return AVATAR_X_MM - AVATAR_GUTTER_MM
  }
  return CONTENT_RIGHT_MM
}

function drawHeader(ctx: RenderContext): void {
  ctx.pdf.setFont(ctx.font, 'normal')
  ctx.pdf.setFontSize(9)
  setColor(ctx, COLORS.muted)
  ctx.pdf.text(ctx.title, PAGE_WIDTH_MM / 2, HEADER_TITLE_Y_MM, {
    align: 'center',
    maxWidth: CONTENT_RIGHT_MM - CONTENT_LEFT_MM,
  })
  setStroke(ctx, COLORS.rule)
  ctx.pdf.setLineWidth(0.2)
  ctx.pdf.line(CONTENT_LEFT_MM, HEADER_RULE_Y_MM, CONTENT_RIGHT_MM, HEADER_RULE_Y_MM)
}

function newPage(ctx: RenderContext): void {
  ctx.pdf.addPage()
  ctx.page += 1
  drawHeader(ctx)
  ctx.y = CONTENT_TOP_MM
}

function ensureSpace(ctx: RenderContext, neededMm: number): void {
  if (ctx.y + neededMm > CONTENT_BOTTOM_MM) {
    newPage(ctx)
  }
}

function addSpaceBefore(ctx: RenderContext, mm: number): void {
  if (ctx.y > CONTENT_TOP_MM) {
    ctx.y = Math.min(ctx.y + mm, CONTENT_BOTTOM_MM)
  }
}

function flattenInline(
  tokens: unknown[],
  base: TextStyle,
  out: { text: string; style: TextStyle }[],
): void {
  for (const raw of tokens) {
    const token = raw as Record<string, unknown> & { type: string }
    const children = token.tokens as unknown[] | undefined

    switch (token.type) {
      case 'strong':
        flattenInline(children ?? [], { ...base, bold: true }, out)
        break
      case 'em':
        flattenInline(children ?? [], { ...base, italic: true }, out)
        break
      case 'del':
        flattenInline(children ?? [], base, out)
        break
      case 'link':
        flattenInline(
          children ?? [{ type: 'text', text: token.text }],
          { ...base, link: token.href as string },
          out,
        )
        break
      case 'codespan':
        out.push({ text: decodeEntities(String(token.text ?? '')), style: { ...base, code: true } })
        break
      case 'br':
        out.push({ text: '\n', style: base })
        break
      case 'text':
        if (children?.length) {
          flattenInline(children, base, out)
        } else {
          out.push({ text: decodeEntities(String(token.text ?? '')), style: base })
        }
        break
      default:
        if (children?.length) {
          flattenInline(children, base, out)
        } else if (token.text) {
          out.push({ text: decodeEntities(String(token.text)), style: base })
        }
    }
  }
}

function buildWords(tokens: unknown[]): Word[] {
  const runs: { text: string; style: TextStyle }[] = []
  flattenInline(tokens, { bold: false, italic: false }, runs)

  const words: Word[] = []
  for (const run of runs) {
    const segments = run.text.split('\n')
    segments.forEach((segment, index) => {
      if (index > 0) words.push({ text: '', style: run.style, isBreak: true })
      for (const piece of segment.split(/\s+/)) {
        if (piece) words.push({ text: piece, style: run.style })
      }
    })
  }
  return words
}

function drawRichText(
  ctx: RenderContext,
  words: Word[],
  options: RichTextOptions,
): void {
  const {
    sizePt,
    lineHeightFactor,
    color,
    forceBold = false,
    indentMm = 0,
    hangingIndentMm = 0,
    prefix,
  } = options

  const lineHeight = ptToMm(sizePt * lineHeightFactor)
  const baselineOffset = ptToMm(sizePt * 0.76)
  const textLeft = CONTENT_LEFT_MM + indentMm + hangingIndentMm
  const prefixLeft = CONTENT_LEFT_MM + indentMm

  let isFirstLine = true
  let index = 0

  if (words.length === 0) return

  while (index < words.length) {
    ensureSpace(ctx, lineHeight)
    const lineY = ctx.y
    const rightEdge = rightEdgeAt(ctx, lineY)

    const lineItems: { text: string; style: TextStyle; x: number }[] = []
    let cursorX = textLeft
    let consumedBreak = false

    while (index < words.length) {
      const word = words[index]

      if (word.isBreak) {
        index += 1
        consumedBreak = true
        break
      }

      const style = forceBold ? { ...word.style, bold: true } : word.style
      applyFont(ctx, style, sizePt)
      const wordWidth = ctx.pdf.getTextWidth(word.text)
      const gap = lineItems.length > 0 ? ctx.pdf.getTextWidth(' ') : 0

      if (lineItems.length > 0 && cursorX + gap + wordWidth > rightEdge) {
        break
      }

      cursorX += gap
      lineItems.push({ text: word.text, style, x: cursorX })
      cursorX += wordWidth
      index += 1
    }

    const baselineY = lineY + baselineOffset

    if (isFirstLine && prefix) {
      applyFont(ctx, { bold: prefix.bold ?? false, italic: false }, sizePt)
      setColor(ctx, color)
      ctx.pdf.text(prefix.text, prefixLeft, baselineY)
    }

    for (const item of lineItems) {
      applyFont(ctx, item.style, sizePt)
      setColor(ctx, item.style.link ? COLORS.link : color)
      ctx.pdf.text(item.text, item.x, baselineY)

      if (item.style.link) {
        const width = ctx.pdf.getTextWidth(item.text)
        setStroke(ctx, COLORS.link)
        ctx.pdf.setLineWidth(0.15)
        ctx.pdf.line(item.x, baselineY + 0.6, item.x + width, baselineY + 0.6)
      }
    }

    ctx.y += lineHeight
    isFirstLine = false

    if (consumedBreak && index >= words.length) {
      // trailing hard break, nothing more to render
      break
    }
  }
}

function drawHeadingRule(ctx: RenderContext): void {
  ensureSpace(ctx, 1.5)
  setStroke(ctx, COLORS.rule)
  ctx.pdf.setLineWidth(0.2)
  ctx.pdf.line(CONTENT_LEFT_MM, ctx.y, CONTENT_RIGHT_MM, ctx.y)
  ctx.y += 1.5
}

function keepHeadingWithContent(ctx: RenderContext, headingHeightMm: number): void {
  const required = headingHeightMm + ptToMm(10.5 * 1.4) * 2
  if (ctx.y > CONTENT_TOP_MM && ctx.y + required > CONTENT_BOTTOM_MM) {
    newPage(ctx)
  }
}

function renderHeading(ctx: RenderContext, token: Record<string, unknown>): void {
  const depth = Number(token.depth ?? 2)
  const words = buildWords((token.tokens as unknown[]) ?? [])

  if (depth <= 1) {
    addSpaceBefore(ctx, 1)
    drawRichText(ctx, words, {
      sizePt: 22,
      lineHeightFactor: 1.18,
      color: COLORS.heading,
      forceBold: true,
    })
    ctx.y += 2
    return
  }

  if (depth === 2) {
    addSpaceBefore(ctx, 6)
    keepHeadingWithContent(ctx, ptToMm(11 * 1.3))
    const upper = words.map((w) => ({ ...w, text: w.text.toUpperCase() }))
    drawRichText(ctx, upper, {
      sizePt: 11,
      lineHeightFactor: 1.3,
      color: COLORS.accent,
      forceBold: true,
    })
    drawHeadingRule(ctx)
    ctx.y += 1.5
    return
  }

  addSpaceBefore(ctx, 3.5)
  keepHeadingWithContent(ctx, ptToMm(12 * 1.3))
  drawRichText(ctx, words, {
    sizePt: 12,
    lineHeightFactor: 1.3,
    color: COLORS.heading,
    forceBold: true,
  })
  ctx.y += 1
}

function renderParagraph(ctx: RenderContext, token: Record<string, unknown>): void {
  const words = buildWords((token.tokens as unknown[]) ?? [])
  drawRichText(ctx, words, {
    sizePt: 10.5,
    lineHeightFactor: 1.42,
    color: COLORS.body,
  })
  ctx.y += 2.8
}

function renderList(
  ctx: RenderContext,
  token: Record<string, unknown>,
  depth = 0,
): void {
  const ordered = Boolean(token.ordered)
  const start = Number(token.start ?? 1)
  const items = (token.items as Record<string, unknown>[]) ?? []
  const indent = 4 + depth * 6

  items.forEach((item, itemIndex) => {
    const prefixText = ordered ? `${start + itemIndex}.` : '\u2022'
    const itemTokens = (item.tokens as Record<string, unknown>[]) ?? []

    let rendered = false
    for (const child of itemTokens) {
      if (child.type === 'list') {
        renderList(ctx, child, depth + 1)
        continue
      }

      const inline =
        (child.tokens as unknown[] | undefined) ??
        (child.text ? [{ type: 'text', text: child.text }] : [])
      const words = buildWords(inline)

      drawRichText(ctx, words, {
        sizePt: 10.5,
        lineHeightFactor: 1.42,
        color: COLORS.body,
        indentMm: indent,
        hangingIndentMm: 5,
        prefix: rendered ? undefined : { text: prefixText, bold: false },
      })
      rendered = true
    }

    if (!rendered) {
      drawRichText(ctx, [], {
        sizePt: 10.5,
        lineHeightFactor: 1.42,
        color: COLORS.body,
        indentMm: indent,
        hangingIndentMm: 5,
        prefix: { text: prefixText, bold: false },
      })
    }

    ctx.y += 1.4
  })

  ctx.y += 1.6
}

function renderBlockquote(ctx: RenderContext, token: Record<string, unknown>): void {
  const startY = ctx.y
  const children = (token.tokens as Record<string, unknown>[]) ?? []

  for (const child of children) {
    if (child.type === 'paragraph') {
      const words = buildWords((child.tokens as unknown[]) ?? [])
      drawRichText(ctx, words, {
        sizePt: 10.5,
        lineHeightFactor: 1.42,
        color: COLORS.muted,
        indentMm: 6,
      })
      ctx.y += 2.4
    }
  }

  setStroke(ctx, COLORS.quoteBar)
  ctx.pdf.setLineWidth(0.8)
  if (ctx.y > startY) {
    ctx.pdf.line(CONTENT_LEFT_MM + 1, startY, CONTENT_LEFT_MM + 1, ctx.y - 2)
  }
  ctx.y += 1.5
}

function renderCode(ctx: RenderContext, token: Record<string, unknown>): void {
  const lines = String(token.text ?? '').split('\n')
  for (const line of lines) {
    const words: Word[] = line
      ? [{ text: line, style: { bold: false, italic: false, code: true } }]
      : [{ text: '', style: { bold: false, italic: false }, isBreak: true }]
    drawRichText(ctx, words, {
      sizePt: 9.5,
      lineHeightFactor: 1.4,
      color: COLORS.body,
      indentMm: 4,
    })
  }
  ctx.y += 2.4
}

function renderTokens(ctx: RenderContext, tokens: unknown[]): void {
  for (const raw of tokens) {
    const token = raw as Record<string, unknown> & { type: string }

    switch (token.type) {
      case 'heading':
        renderHeading(ctx, token)
        break
      case 'paragraph':
        renderParagraph(ctx, token)
        break
      case 'list':
        renderList(ctx, token)
        break
      case 'blockquote':
        renderBlockquote(ctx, token)
        break
      case 'code':
        renderCode(ctx, token)
        break
      case 'hr':
      case 'space':
        break
      default: {
        const text = token.text ? String(token.text) : ''
        if (text.trim()) {
          drawRichText(ctx, buildWords([{ type: 'text', text }]), {
            sizePt: 10.5,
            lineHeightFactor: 1.42,
            color: COLORS.body,
          })
          ctx.y += 2.8
        }
      }
    }
  }
}

function detectImageFormat(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' | null {
  const match = /^data:image\/(png|jpe?g|webp)/i.exec(dataUrl)
  if (!match) return null
  const type = match[1].toLowerCase()
  if (type === 'png') return 'PNG'
  if (type === 'webp') return 'WEBP'
  return 'JPEG'
}

function drawAvatar(ctx: RenderContext, dataUrl: string): void {
  const format = detectImageFormat(dataUrl)
  if (!format) return
  try {
    ctx.pdf.addImage(
      dataUrl,
      format,
      AVATAR_X_MM,
      CONTENT_TOP_MM,
      AVATAR_SIZE_MM,
      AVATAR_SIZE_MM,
      undefined,
      'FAST',
    )
  } catch {
    // Ignore avatar rendering errors so the CV still exports.
  }
}

function drawFooters(ctx: RenderContext): void {
  const total = ctx.pdf.getNumberOfPages()
  for (let page = 1; page <= total; page += 1) {
    ctx.pdf.setPage(page)
    ctx.pdf.setFont(ctx.font, 'normal')
    ctx.pdf.setFontSize(9)
    setColor(ctx, COLORS.muted)
    ctx.pdf.text(`${page} / ${total}`, PAGE_WIDTH_MM / 2, FOOTER_Y_MM, {
      align: 'center',
    })
  }
}

export async function downloadCvPdf(
  markdown: string,
  filename = defaultCvPdfFilename(),
  options: CvPdfOptions = {},
): Promise<void> {
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const font = await registerCvPdfFont(pdf)
  const documentTitle = options.documentTitle ?? filename.replace(/\.pdf$/i, '')

  const ctx: RenderContext = {
    pdf,
    font,
    title: documentTitle,
    hasAvatar: Boolean(options.avatarDataUrl),
    y: CONTENT_TOP_MM,
    page: 1,
  }

  drawHeader(ctx)
  if (options.avatarDataUrl) {
    drawAvatar(ctx, options.avatarDataUrl)
  }

  const tokens = marked.lexer(markdown)
  renderTokens(ctx, tokens)

  drawFooters(ctx)

  pdf.save(filename)
}
