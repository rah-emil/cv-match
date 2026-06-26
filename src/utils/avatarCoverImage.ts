export interface CoverSourceRect {
  sx: number
  sy: number
  sw: number
  sh: number
}

/** Computes source crop for CSS background-size: cover / object-fit: cover. */
export function computeCoverSourceRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): CoverSourceRect {
  const sourceRatio = sourceWidth / sourceHeight
  const targetRatio = targetWidth / targetHeight

  if (sourceRatio > targetRatio) {
    const sh = sourceHeight
    const sw = sourceHeight * targetRatio
    return {
      sx: (sourceWidth - sw) / 2,
      sy: 0,
      sw,
      sh,
    }
  }

  const sw = sourceWidth
  const sh = sourceWidth / targetRatio
  return {
    sx: 0,
    sy: (sourceHeight - sh) / 2,
    sw,
    sh,
  }
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load avatar image'))
    image.src = dataUrl
  })
}

export async function renderAvatarCoverDataUrl(
  dataUrl: string,
  sizePx: number,
  borderPx = 0,
  borderColor = '#eef2ff',
): Promise<string> {
  const image = await loadImage(dataUrl)
  const canvas = document.createElement('canvas')
  const totalSize = sizePx + borderPx * 2
  canvas.width = totalSize
  canvas.height = totalSize

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create avatar canvas')

  const center = totalSize / 2
  const outerRadius = totalSize / 2
  const innerRadius = sizePx / 2
  const imageX = borderPx
  const imageY = borderPx

  if (borderPx > 0) {
    ctx.beginPath()
    ctx.arc(center, center, outerRadius, 0, Math.PI * 2)
    ctx.fillStyle = borderColor
    ctx.fill()
  }

  ctx.save()
  ctx.beginPath()
  ctx.arc(center, center, innerRadius, 0, Math.PI * 2)
  ctx.clip()

  const crop = computeCoverSourceRect(
    image.naturalWidth,
    image.naturalHeight,
    sizePx,
    sizePx,
  )

  ctx.drawImage(
    image,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    imageX,
    imageY,
    sizePx,
    sizePx,
  )
  ctx.restore()

  return canvas.toDataURL('image/png')
}
