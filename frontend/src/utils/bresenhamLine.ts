export const calculateLineCoordinates = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) => {
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = Math.sign(x1 - x0)
  const sy = Math.sign(y1 - y0)
  let err = dx - dy
  const coorList = []

  let currentX = x0
  let currentY = y0

  while (true) {
    coorList.push({ x0: currentX, y0: currentY })

    if (currentX === x1 && currentY === y1) break

    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      currentX += sx
    }
    if (e2 < dx) {
      err += dx
      currentY += sy
    }
  }
  return coorList
}
