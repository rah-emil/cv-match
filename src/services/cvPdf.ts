import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import {
  createCvRenderRoot,
  CV_DOCUMENT_WIDTH_PX,
  defaultCvPdfFilename,
  type CvDocumentOptions,
} from '../templates/cvDocument'

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297
const PAGE_HEADER_HEIGHT_MM = 14
const PAGE_FOOTER_HEIGHT_MM = 12
const PAGE_CONTENT_HEIGHT_MM =
  A4_HEIGHT_MM - PAGE_HEADER_HEIGHT_MM - PAGE_FOOTER_HEIGHT_MM

export interface CvPdfOptions extends CvDocumentOptions {
  documentTitle?: string
}

export async function downloadCvPdf(
  markdown: string,
  filename = defaultCvPdfFilename(),
  options: CvPdfOptions = {},
): Promise<void> {
  const root = createCvRenderRoot(markdown, options)
  document.body.appendChild(root)

  try {
    await waitForLayout()

    const canvas = await html2canvas(root, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      width: CV_DOCUMENT_WIDTH_PX,
      windowWidth: CV_DOCUMENT_WIDTH_PX,
    })

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
    const imgWidthMm = A4_WIDTH_MM
    const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width
    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    const documentTitle =
      options.documentTitle ?? filename.replace(/\.pdf$/i, '')
    const totalPages = Math.max(1, Math.ceil(imgHeightMm / PAGE_CONTENT_HEIGHT_MM))

    let heightLeft = imgHeightMm
    let position = PAGE_HEADER_HEIGHT_MM
    let pageNumber = 1

    while (heightLeft > 0) {
      if (pageNumber > 1) {
        pdf.addPage()
      }

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidthMm, imgHeightMm)
      drawPageHeader(pdf, documentTitle)
      drawPageFooter(pdf, pageNumber, totalPages)

      heightLeft -= PAGE_CONTENT_HEIGHT_MM
      position -= PAGE_CONTENT_HEIGHT_MM
      pageNumber += 1
    }

    pdf.save(filename)
  } finally {
    root.remove()
  }
}

function drawPageHeader(pdf: jsPDF, title: string): void {
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(120, 120, 120)
  pdf.text(title, A4_WIDTH_MM / 2, 8, { align: 'center' })
  pdf.setDrawColor(230, 230, 230)
  pdf.line(15, 10, A4_WIDTH_MM - 15, 10)
}

function drawPageFooter(pdf: jsPDF, pageNumber: number, totalPages: number): void {
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(120, 120, 120)
  pdf.text(`${pageNumber} / ${totalPages}`, A4_WIDTH_MM / 2, A4_HEIGHT_MM - 8, {
    align: 'center',
  })
}

function waitForLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}
