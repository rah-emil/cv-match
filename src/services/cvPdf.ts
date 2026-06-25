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

export async function downloadCvPdf(
  markdown: string,
  filename = defaultCvPdfFilename(),
  options: CvDocumentOptions = {},
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

    let heightLeft = imgHeightMm
    let position = 0

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidthMm, imgHeightMm)
    heightLeft -= A4_HEIGHT_MM

    while (heightLeft > 0) {
      position -= A4_HEIGHT_MM
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidthMm, imgHeightMm)
      heightLeft -= A4_HEIGHT_MM
    }

    pdf.save(filename)
  } finally {
    root.remove()
  }
}

function waitForLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}
