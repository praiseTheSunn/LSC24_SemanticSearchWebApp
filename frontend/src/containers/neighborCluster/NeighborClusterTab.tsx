import { Box, Divider } from '@mui/material'
import { useRef } from 'react'
import {
  AutoSizer,
  List,
  type ListRowProps,
  type ListRowRenderer,
} from 'react-virtualized'
import { useAppSelector } from '../../AppState'
import { NeighborRow } from './HorizontalAutoscrollRow'

const NeighborClusterTab = () => {
  const data = useAppSelector((state) => state.app.data)
  const Config = useAppSelector((state) => state.app.config)
  const cellHeight = (Config.NeighborTabRowHeight ?? 150) + 10
  // const data = sampledata
  const listRef = useRef<List>(null)

  const renderRow: ListRowRenderer = ({
    index,
    key,
    style,
    parent,
  }: ListRowProps) => {
    const rowIndex = index
    const imageData = data[rowIndex]

    return (
      <NeighborRow
        key={key}
        imageData={imageData}
        style={style}
        config={Config}
      />
    )
  }

  return (
    <Box
      sx={{
        overflow: 'hidden',
        height: '100%',
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: 'calc(100% - 16px)',
          marginRight: 0,
          marginLeft: 0,
          paddingTop: '16px',
          paddingBottom: 0,
          position: 'relative',
        }}
      >
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => (
            <List
              width={width}
              height={height}
              ref={listRef}
              rowHeight={cellHeight}
              rowRenderer={renderRow}
              rowCount={data.length}
              overscanRowCount={3}
              scrollToAlignment="center"
              style={{ transition: 'transform ease-in-out 0.5s' }}
            />
          )}
        </AutoSizer>
      </Box>
    </Box>
  )
}

export default NeighborClusterTab
