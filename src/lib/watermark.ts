export const DEFAULT_WATERMARK_TEXT = 'PODGLĄD — KUCZEWSKA.COM'
const DEFAULT_TILE_SPACING = 260
const ROTATION_DEGREES = -30

export type WatermarkTile = {
  x: number
  y: number
}

export type WatermarkPattern = {
  tiles: WatermarkTile[]
  rotationRadians: number
}

/**
 * Pure geometry: a diagonal, tiled grid of watermark positions that overscans
 * the image bounds so rotated tiles still cover the corners.
 */
export function computeWatermarkPattern(
  imageWidth: number,
  imageHeight: number,
  spacing: number = DEFAULT_TILE_SPACING,
): WatermarkPattern {
  if (imageWidth <= 0 || imageHeight <= 0) {
    throw new RangeError('imageWidth and imageHeight must be positive')
  }

  const overscan = spacing
  const tiles: WatermarkTile[] = []
  for (let y = -overscan; y < imageHeight + overscan; y += spacing) {
    for (let x = -overscan; x < imageWidth + overscan; x += spacing) {
      tiles.push({ x, y })
    }
  }

  return { tiles, rotationRadians: (ROTATION_DEGREES * Math.PI) / 180 }
}

export type WatermarkContext = Pick<
  CanvasRenderingContext2D,
  'save' | 'restore' | 'translate' | 'rotate' | 'fillText' | 'font' | 'fillStyle' | 'globalAlpha' | 'textAlign'
>

export function drawWatermark(
  ctx: WatermarkContext,
  imageWidth: number,
  imageHeight: number,
  text: string = DEFAULT_WATERMARK_TEXT,
): void {
  const pattern = computeWatermarkPattern(imageWidth, imageHeight)

  ctx.font = 'bold 42px sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.textAlign = 'center'

  for (const tile of pattern.tiles) {
    ctx.save()
    ctx.translate(tile.x, tile.y)
    ctx.rotate(pattern.rotationRadians)
    ctx.fillText(text, 0, 0)
    ctx.restore()
  }
}

/**
 * Bakes the watermark into the image pixels before it ever leaves the
 * photographer's browser — no un-watermarked file is ever uploaded.
 */
export async function watermarkImage(source: Blob, text: string = DEFAULT_WATERMARK_TEXT): Promise<Blob> {
  const bitmap = await createImageBitmap(source)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas 2D context is not available in this environment.')
  }

  ctx.drawImage(bitmap, 0, 0)
  drawWatermark(ctx, canvas.width, canvas.height, text)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result)
        } else {
          reject(new Error('Nie udało się wygenerować podglądu ze znakiem wodnym.'))
        }
      },
      'image/jpeg',
      0.92,
    )
  })
}
