import { marked } from 'marked'

marked.setOptions({ breaks: true, gfm: true })

export const CV_DOCUMENT_WIDTH_PX = 794

export const CV_TEMPLATE_STYLES = `
  .cv-doc {
    box-sizing: border-box;
    width: ${CV_DOCUMENT_WIDTH_PX}px;
    min-height: 1123px;
    padding: 48px 52px 56px;
    background: #ffffff;
    color: #1f1f1f;
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.55;
  }

  .cv-doc__accent {
    height: 4px;
    width: 72px;
    border-radius: 999px;
    background: linear-gradient(90deg, #2f54eb 0%, #597ef7 100%);
  }

  .cv-doc__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 28px;
  }

  .cv-doc__avatar {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #eef2ff;
    flex-shrink: 0;
  }

  .cv-doc__body h1 {
    margin: 0 0 6px;
    font-size: 26pt;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: #141414;
  }

  .cv-doc__body h2 {
    margin: 22px 0 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #e8e8e8;
    font-size: 11pt;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #2f54eb;
  }

  .cv-doc__body h3 {
    margin: 14px 0 4px;
    font-size: 11.5pt;
    font-weight: 600;
    color: #141414;
  }

  .cv-doc__body p {
    margin: 0 0 8px;
    color: #434343;
  }

  .cv-doc__body ul,
  .cv-doc__body ol {
    margin: 0 0 10px;
    padding-left: 18px;
  }

  .cv-doc__body li {
    margin-bottom: 4px;
    color: #434343;
  }

  .cv-doc__body li:last-child {
    margin-bottom: 0;
  }

  .cv-doc__body strong {
    font-weight: 600;
    color: #141414;
  }

  .cv-doc__body a {
    color: #2f54eb;
    text-decoration: none;
  }

  .cv-doc__body hr {
    display: none;
  }
`

export interface CvDocumentOptions {
  avatarDataUrl?: string
}

export function renderCvDocumentHtml(
  markdown: string,
  options: CvDocumentOptions = {},
): string {
  const bodyHtml = marked.parse(markdown, { async: false }) as string
  const avatarHtml = options.avatarDataUrl
    ? `<img class="cv-doc__avatar" src="${options.avatarDataUrl}" alt="" />`
    : ''

  return `
    <div class="cv-doc">
      <div class="cv-doc__header">
        <div class="cv-doc__accent"></div>
        ${avatarHtml}
      </div>
      <div class="cv-doc__body">${bodyHtml}</div>
    </div>
  `
}

export function createCvRenderRoot(
  markdown: string,
  options: CvDocumentOptions = {},
): HTMLDivElement {
  const root = document.createElement('div')
  root.className = 'cv-pdf-root'
  root.innerHTML = `<style>${CV_TEMPLATE_STYLES}</style>${renderCvDocumentHtml(markdown, options)}`
  root.style.position = 'fixed'
  root.style.left = '-12000px'
  root.style.top = '0'
  root.style.width = `${CV_DOCUMENT_WIDTH_PX}px`
  root.style.background = '#ffffff'
  root.style.zIndex = '-1'
  return root
}

export function defaultCvPdfFilename(date = new Date()): string {
  return `tailored-cv-${date.toISOString().slice(0, 10)}.pdf`
}
