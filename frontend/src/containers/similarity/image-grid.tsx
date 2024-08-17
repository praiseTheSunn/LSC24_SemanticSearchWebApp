import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeGrid as Grid } from 'react-window'
import { AnImage } from '../../components'
import { Box } from '@mui/material'
import { useAppSelector } from '../../AppState'

const ImageGrid = ({ cellHeight, cell } : {
  cellHeight?: number,
  cell?: any
}) => {
  cellHeight = cellHeight ? cellHeight : 125 // Default cell height

  const simData = useAppSelector((state) => state.app.data)
  const columnCount = 9 // Number of columns in the grid

  const Cell = ({ columnIndex, rowIndex, style } : {
    columnIndex: number,
    rowIndex: number,
    style: React.CSSProperties
  }) => {
    const index = rowIndex * columnCount + columnIndex
    if (index >= simData.length) return null // Ensure not to exceed simData length

    const data = simData[index]

    return (
      <Box style={style}>
        <Box sx={{ height: '100%', overflow: 'hidden', padding: '0.125rem'}} >
          <AnImage key={index} data={data} index={index} />
        </Box>
      </Box>
    )
  }

  cell = cell ? cell : Cell

  return (
    <Box sx={{height: '100dvh', width: '100dvw'}}>
      <AutoSizer>
        {({ height, width }) => {
          const columnWidth = width / columnCount - 1.5
          const rowHeight = cellHeight // Making rows square by setting row height equal to column width
          const rowCount = Math.ceil(simData.length / columnCount)

          return (
            <Grid
              columnCount={columnCount}
              columnWidth={columnWidth}
              height={height}
              rowCount={rowCount}
              rowHeight={rowHeight}
              width={width}
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