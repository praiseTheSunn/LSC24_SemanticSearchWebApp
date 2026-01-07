import bodyPartToIndex from '../../data/JointMapping'
import type { ConfigType } from '../../types/app'
import { calculateDistance } from '../calcDistance'

interface PoseEncodingParams {
  selectedPose: Record<string, [number, number]> | null
  systemConfig: ConfigType
}

export const poseEncoding = ({
  selectedPose,
  systemConfig,
}: PoseEncodingParams) => {
  let pose_local_encoding = ''
  const pose_parts: string[] = []

  for (const key in selectedPose) {
    const [x, y] = selectedPose[key]

    const cellY = Math.ceil(y / (systemConfig.WhiteboardCanvasHeight / 20)) - 1
    const cellX = Math.ceil(x / (systemConfig.WhiteboardCanvasWidth / 20)) - 1

    // console.log('Key:', key, 'Y:', cellY, 'X:', cellX)
    const encode = `${String.fromCharCode(65 + cellY)}${String.fromCharCode(97 + cellX)}${bodyPartToIndex[key]}`

    pose_parts.push(encode)

    // Iterate over surrounding cells (-1, 0, 1)
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        if (i === 0 && j === 0) continue // Skip the current cell

        const surroundingCellRow = cellY + i
        const surroundingCellCol = cellX + j

        // Ensure surrounding cells are within grid bounds
        const gridRows = 20 // Assuming a 20x20 grid
        const gridCols = 20

        if (
          surroundingCellRow < 0 ||
          surroundingCellRow >= gridRows ||
          surroundingCellCol < 0 ||
          surroundingCellCol >= gridCols
        ) {
          continue
        }

        // Calculate the surrounding cell's center
        const cellSizeHeight = systemConfig.WhiteboardCanvasHeight / gridRows
        const cellSizeWidth = systemConfig.WhiteboardCanvasWidth / gridCols

        const surroundingCenterX = (surroundingCellCol + 0.5) * cellSizeWidth
        const surroundingCenterY = (surroundingCellRow + 0.5) * cellSizeHeight

        // Calculate distances from the keypoint to the surrounding cell's center
        const distanceY = calculateDistance(x, y, x, surroundingCenterY)
        const distanceX = calculateDistance(x, y, surroundingCenterX, y)

        // If the keypoint is near the center of the surrounding cell, add it to the grid
        if (
          distanceY < 3 * 0.8 * cellSizeHeight &&
          distanceX < 3 * 0.8 * cellSizeWidth
        ) {
          // console.log("SURROUND: ", surroundingCellRow, surroundingCellCol, key);
          const encode = `${String.fromCharCode(65 + surroundingCellRow)}${String.fromCharCode(97 + surroundingCellCol)}${bodyPartToIndex[key]}`
          pose_parts.push(encode)
        }
      }
    }
  }

  pose_local_encoding = pose_parts.join(' ')
  return pose_local_encoding
}
