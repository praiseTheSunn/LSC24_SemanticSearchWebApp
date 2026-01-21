import { useEffect, useMemo, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeGrid as Grid } from 'react-window'
import { useAppSelector } from '../../AppState'
import { ImageGroup } from '../../components'
import type { ImageRecord } from '../../types/image'

interface SimialrityAdvancedGridProps {
  tabindex: number
}

const SimialrityAdvancedGrid: React.FC<SimialrityAdvancedGridProps> = ({
  tabindex,
}) => {
  const data = useAppSelector((state) => state.app.data)

  const { locationBasedData, timeBasedData, videoBasedData } = useMemo(() => {
    const locationDataMap = new Map<string, ImageRecord[]>()
    const timeDataMap = new Map<string, ImageRecord[]>()
    const videoDataMap = new Map<string, ImageRecord[]>()

    for (const item of data) {
      const location = item.location
      if (!locationDataMap.has(location)) {
        locationDataMap.set(location, [])
      }
      const locationArray = locationDataMap.get(location)
      if (locationArray) {
        locationArray.push(item)
      }

      const date = item.date
      if (!timeDataMap.has(date)) {
        timeDataMap.set(date, [])
      }
      const timeArray = timeDataMap.get(date)
      if (timeArray) {
        timeArray.push(item)
      }

      const videoId = item.video_id
      if (videoId && !videoDataMap.has(videoId)) {
        videoDataMap.set(videoId, [])
      }
      const videoArray = videoDataMap.get(videoId)
      if (videoArray) {
        videoArray.push(item)
      }
    }

    // Sort the arrays
    for (const value of locationDataMap.values()) {
      value.sort((a: ImageRecord, b: ImageRecord) => (b?.score ?? 0) - (a?.score ?? 0))
    }
    for (const value of timeDataMap.values()) {
      value.sort((a: ImageRecord, b: ImageRecord) => (b?.score ?? 0) - (a?.score ?? 0))
    }
    for (const value of videoDataMap.values()) {
      value.sort((a: ImageRecord, b: ImageRecord) => (b?.score ?? 0) - (a?.score ?? 0))
    }

    return {
      locationBasedData: Array.from(locationDataMap.values()),
      timeBasedData: Array.from(timeDataMap.values()),
      videoBasedData: Array.from(videoDataMap.values())
    }
  }, [data])

  // let totalItems: number = 0;
  // totalItems: number = 0;
  const glob_columnCount: number = 9

  const displayData = useMemo(() => {
    if (tabindex === 2) return locationBasedData
    if (tabindex === 3) return videoBasedData
    return timeBasedData
  }, [tabindex, locationBasedData, timeBasedData, videoBasedData])

  const cellRenderer = ({
    columnIndex,
    rowIndex,
    style,
  }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
    const item: ImageRecord[] = displayData?.[rowIndex * glob_columnCount + columnIndex]
    if (!item) return null

    return (
      <div style={{ ...style }}>
        <div style={{ margin: '0 2px' }}>
          {' '}
          {/* Thêm margin vào bên trong */}
          <ImageGroup
            images={item}
            title={
              tabindex === 2
                ? item[0]?.location
                : tabindex === 3
                  ? item[0]?.video_id
                  : item[0]?.date
            }
          />
        </div>
      </div>
    )
  }
  

  return (
    <div
      style={{
        width: '99dvw',
        height: '98%',
      }}
    >
      <AutoSizer>
        {({ height, width }: { height: number; width: number }) => {
          const columnCount: number = glob_columnCount
          const cellWidth: number = width / columnCount - 1.5
          const cellHeight: number = 240

          const displayData =
            tabindex === 2 ? locationBasedData : tabindex === 3 ? videoBasedData : timeBasedData
          const rowCount: number = Math.ceil(displayData.length / columnCount)
          return (
            <Grid
              columnCount={columnCount}
              columnWidth={cellWidth}
              height={height}
              rowCount={rowCount}
              rowHeight={cellHeight}
              width={width}
              itemData={displayData}
              overscanRowCount={3}
            >
              {cellRenderer}
            </Grid>
          )
        }}
      </AutoSizer>
    </div>
  )
}

export default SimialrityAdvancedGrid
