import { Box } from '@mui/material'
import type { CSSProperties } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeGrid as Grid } from 'react-window'
import { useAppSelector } from '../../AppState'
import { AnImage } from '../../components'
import type { ImageRecord } from '../../types/image'

const ImageGrid = ({
  cellHeight,
  cell,
  data,
  style,
}: {
  cellHeight?: number
  cell?: any
  data: ImageRecord[]
  style: CSSProperties
}) => {
  const Config = useAppSelector((state) => state.app.config)
  cellHeight = cellHeight ? cellHeight : Config.ImageGridCellHeight

  const simData = data
  const columnCount = Config.ImageGridColumnCount

  const Cell = ({
    columnIndex,
    rowIndex,
    style,
  }: {
    columnIndex: number
    rowIndex: number
    style: React.CSSProperties
  }) => {
    const index = rowIndex * columnCount + columnIndex
    if (index >= simData.length) return null // Ensure not to exceed simData length

    const data = simData[index]
    return (
      <div style={style}>
        <Box
          sx={{
            height: `calc(${style.height}px - 2 * ${Config.gridRowGap})`,
            position: 'relative',
            overflow: 'hidden',
            padding: Config.gridRowGap,
          }}
        >
          <AnImage key={index} data={data} index={index} />
        </Box>
      </div>
    )
  }

  cell = cell ? cell : Cell

  return (
    <Box sx={style}>
      <AutoSizer>
        {({ height, width }) => {
          const columnWidth = width / columnCount - 1.5
          const rowHeight = cellHeight + 2 // Making rows square by setting row height equal to column width
          const rowCount = Math.ceil(simData.length / columnCount)

          return (
            <Grid
              columnCount={columnCount}
              columnWidth={columnWidth}
              height={height}
              rowCount={rowCount}
              rowHeight={rowHeight}
              width={width}
              overscanRowCount={7}
            >
              {cell}
            </Grid>
          )
        }}
      </AutoSizer>
    </Box>
  )
}

export default ImageGrid
