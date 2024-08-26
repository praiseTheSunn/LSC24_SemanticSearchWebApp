import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeGrid as Grid } from 'react-window'
import { AnImage } from '../../components'
import { Box } from '@mui/material'
import { useAppSelector } from '../../AppState'

export const gridRowGap = '2px'

const ImageGrid = ({ cellHeight, cell } : {
  cellHeight?: number,
  cell?: any
}) => {
  cellHeight = cellHeight ? cellHeight : 100 // Default cell height

  const simData = useAppSelector((state) => state.app.data)
  const columnCount = 11 // Number of columns in the grid

  const Cell = ({ columnIndex, rowIndex, style } : {
    columnIndex: number,
    rowIndex: number,
    style: React.CSSProperties
  }) => {
    const index = rowIndex * columnCount + columnIndex
    if (index >= simData.length) return null // Ensure not to exceed simData length

    const data = simData[index]
    return (
      <div style={style}>
        <Box sx={{ height: `calc(${style.height}px - 2 * ${gridRowGap})`, position: 'relative', overflow: 'hidden', padding: gridRowGap}} >
          <AnImage key={index} data={data} index={index} />
        </Box>
      </div>
    )
  }

  cell = cell ? cell : Cell

  return (
    <Box sx={{ width: '100dvw'}}>
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
              overscanRowCount={3}
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