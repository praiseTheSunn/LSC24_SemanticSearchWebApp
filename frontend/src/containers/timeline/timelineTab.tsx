import React, {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useAppDispatch, useAppSelector } from '../../AppState'

import { Box, IconButton, Typography } from '@mui/material'
import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  List,
  type ListRowProps,
  type ListRowRenderer,
} from 'react-virtualized'
import {
  ActivityIcon,
  ActivityIconActive,
  LocationIcon,
  LocationIconActive,
} from '../../assets'
import ImageGroup from '../../components/Image/imageGroup'
import ImageSingle from '../../components/Image/imageSingle'
import KhangScrollBar from '../../components/KhangScrollBar'
import ActivityBar from '../../components/activityBar'
import type {
  ImageRecord,
  TimelineTabActivityAllData,
  TimelineTabActivityData,
  TimelineTabLocationAllData,
  TimelineTabLocationData,
} from '../../types/image'

const TimelineTab = () => {
  const data = useAppSelector((state) => state.app.data)

  const [rowModes, setRowModes] = useState<number[]>([0]) // 0 location, 1 activity, State to track whether the button is held down
  const [holdActive, setHoldActive] = useState(false) // State to track whether the button is held down
  const [holdTimer, setHoldTimer] = useState<
    string | number | ReturnType<typeof setTimeout> | undefined
  >(undefined)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [inHoldMode, setInHoldMode] = useState(false)
  const [dates, setDates] = useState<string[]>([])
  const [selectedActivityIDs, setSelectedActivityIDs] = useState<
    (number | null)[]
  >([])
  const [locationBasedData, setLocationBasedData] =
    useState<TimelineTabLocationAllData | null>(null)
  const [activityBasedData, setActivityBasedData] =
    useState<TimelineTabActivityAllData | null>(null)

  useEffect(() => {
    const initialSelectedActivityIDs = dates.map(() => null)
    setSelectedActivityIDs(initialSelectedActivityIDs)
  }, [dates])
  const listRef = useRef<List | null>(null)

  const cache = new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 258,
  })

  // Handler for mouse down event
  const handleMouseDown = () => {
    console.log('Mouse down detected')
    setHoldActive(true)

    const timer = setTimeout(() => {
      console.log('Click and hold detected')
      doClickAndHoldAction()
    }, 500)

    setHoldTimer(timer)
  }

  // Handler for mouse up event
  const handleMouseUp = () => {
    clearTimeout(holdTimer)
    setHoldActive(false)
  }

  // Handler for mouse leave event
  const handleMouseLeave = () => {
    clearTimeout(holdTimer)
    setHoldActive(false)
  }

  // Function to perform when click and hold is triggered
  const doClickAndHoldAction = () => {
    console.log('Action to perform after hold')
    setInHoldMode(true)
  }

  useEffect(() => {
    // Parse data into location-based and activity-based data
    const locationDataMap = new Map() // Type: TimelineTabLocationAllData = Map<string, TimelineTabLocationData[]>
    const activityDataMap = new Map() // Type: TimelineTabActivityAllData = Map<string, TimelineTabActivityData[]>

    for (const item of data) {
      if (item.date === '2019-01-12') {
        console.log('item', item)
      }
      // Location-based data
      if (!locationDataMap.has(item.date)) {
        locationDataMap.set(item.date, [])
      }
      const locationRowData = locationDataMap.get(item.date)
      if (
        !locationRowData.some(
          (data: any) => data.location_id === item.location_id,
        )
      ) {
        locationRowData.push({ location_id: item.location_id, images: [item] })
      } else {
        const existingLocation = locationRowData.find(
          (data: any) => data.location_id === item.location_id,
        )
        existingLocation.images.push(item)
      }

      // Activity-based data
      if (!activityDataMap.has(item.date)) {
        activityDataMap.set(item.date, [])
      }
      const activityData = activityDataMap.get(item.date)
      if (
        !activityData.some((data: any) => data.activity === item.activity)
      ) {
        activityData.push({
          activity: item.activity,
          images: [item],
        })
      } else {
        const existingActivity = activityData.find(
          (data: any) => data.activity === item.activity,
        )
        existingActivity.images.push(item)
      }
    }

    // Sort location_id and activity_id ascending in each date of the map
    locationDataMap.forEach((value, key) => {
      value.sort(
        (a: ImageRecord, b: ImageRecord) => a.location_id - b.location_id,
      )
    })
    activityDataMap.forEach((value, key) => {
      value.sort(
        (a: ImageRecord, b: ImageRecord) => String(a.activity).localeCompare(String(b.activity)),
      )
    })
    // console.log('locationDataMap', locationDataMap)
    // console.log('activityDataMap', activityDataMap)

    // Update state
    setLocationBasedData(locationDataMap)
    setActivityBasedData(activityDataMap)

    // Sort dates ascending
    const dates = Array.from(locationDataMap.keys()).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    )
    setDates(dates)

    const initialRowMode = dates.map(() => 0)
    setRowModes(initialRowMode)
  }, [data])

  const recomputeRowHeights = useCallback(() => {
    cache.clearAll()
    if (listRef.current) {
      listRef.current.recomputeRowHeights()
    }
  }, [])

  useEffect(() => {
    recomputeRowHeights
  }, [locationBasedData, activityBasedData])

  // useEffect(() => {
  //   window.addEventListener('resize', recomputeRowHeights);
  //   return () => {
  //       window.removeEventListener('resize', recomputeRowHeights);
  //   };
  // }, []);

  useEffect(() => {
    if (selectedDate && listRef.current) {
      const rowIndex = dates.indexOf(selectedDate)
      if (rowIndex !== -1) {
        listRef.current.scrollToRow(rowIndex)
        // console.log('ref', listRef.current);
      }
    }
  }, [selectedDate])

  const handleChangeRowModes = (rowIndex: number) => {
    const newRowModes = [...rowModes]
    newRowModes[rowIndex] = newRowModes[rowIndex] === 0 ? 1 : 0
    setRowModes(newRowModes)
  }

  const renderRow: ListRowRenderer = ({
    index,
    key,
    style,
    parent,
    isScrolling,
  }: ListRowProps) => {
    const rowIndex = index
    const currentDate = dates[rowIndex]
    const locationRowData: any = locationBasedData?.get(currentDate) || []
    const activityRowData: any = activityBasedData?.get(currentDate) || []

    const selectedActivityID = selectedActivityIDs[rowIndex]
    const filteredActivityData = selectedActivityID
      ? activityRowData.filter(
          (item: any) => item.activity === selectedActivityID,
        )
      : activityRowData

    activityRowData.sort(
      (a: any, b: any) =>
        Math.min(
          a.images.map((img: any) => (Object.values(img)[0] as any).time),
        ) -
        Math.min(
          b.images.map((img: any) => (Object.values(img)[0] as any).time),
        ),
    )

    return (
      <CellMeasurer
        key={key}
        cache={cache}
        parent={parent}
        columnIndex={0}
        rowIndex={rowIndex}
      >
        {({ registerChild }) => (
          <Box
            ref={registerChild}
            display="flex"
            flexDirection="row"
            position="relative"
            sx={style}
          >
            <Box
              sx={{
                width: '25px',
                height: '25px',
                backgroundColor: 'black',
                borderRadius: '9999px',
                mr: '28px',
                zIndex: 10,
              }}
            />

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                mb: '16px',
                position: 'relative',
                width: '96%',
                minHeight: '100px',
                boxShadow: '0px 2px #D7D7D7',
                borderRadius: '10px',
                transition: 'width 0.5s',
              }}
            >
              <Box
                sx={{ width: '100%', display: 'flex', flexDirection: 'row' }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '22px',
                    minWidth: '200px',
                  }}
                >
                  {currentDate}
                </Typography>
                <Box
                  src={
                    rowModes[rowIndex] === 1 ? LocationIcon : LocationIconActive
                  }
                  component="img"
                  onClick={() => handleChangeRowModes(rowIndex)}
                  sx={{ marginRight: '10px', cursor: 'pointer' }}
                />
                <Box
                  src={
                    rowModes[rowIndex] === 0 ? ActivityIcon : ActivityIconActive
                  }
                  component="img"
                  onClick={() => handleChangeRowModes(rowIndex)}
                  sx={{ marginRight: '10px', cursor: 'pointer' }}
                />

                <ActivityBar
                  rowData={activityRowData}
                  visibility={rowModes[rowIndex] === 1 ? 'visible' : 'hidden'}
                  onActivitySelect={(activity) => {
                    const newSelectedActivityIDs = [...selectedActivityIDs]
                    newSelectedActivityIDs[rowIndex] = activity
                    setSelectedActivityIDs(newSelectedActivityIDs)
                  }}
                />
              </Box>

              {rowModes[rowIndex] === 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: '8px',
                    position: 'relative',
                    marginBottom: '12px',
                    marginLeft: '8px',
                  }}
                >
                  {locationRowData.map(
                    (
                      locationItem: TimelineTabLocationData,
                      listIndex: number,
                    ) => (
                      <Box
                        key={`${
                          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                          listIndex
                        }`}
                        sx={{ width: '170px', height: '230px' }}
                      >
                        <ImageGroup
                          sortType={1}
                          images={locationItem.images}
                          title={locationItem.images[0].location}
                        />
                      </Box>
                    ),
                  )}
                </Box>
              )}

              {rowModes[rowIndex] === 1 && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: '8px',
                    position: 'relative',
                    marginBottom: '12px',
                    marginLeft: '8px',
                  }}
                >
                  <Box
                      display="flex"
                      flexDirection="row"
                      flexWrap="wrap"
                      gap="8px"
                    >
                      {filteredActivityData.map(
                        (
                          activityItem: TimelineTabActivityData,
                          listIndex: number,
                        ) => (
                          <Box
                            key={`${
                              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                              listIndex
                            }`}
                            sx={{ width: '170px', height: '230px' }}
                          >
                            <ImageGroup
                              images={activityItem.images}
                              title={activityItem.images[0].activity}
                              sortType={1}
                            />
                          </Box>
                        ),
                      )}
                    </Box>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </CellMeasurer>
    )
  }

  useEffect(() => {
    setInHoldMode(false)
  }, [selectedDate])

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
        {inHoldMode && (
          <Box
            sx={{
              backgroundColor: 'white',
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: 0.95,
              width: '100%',
              height: '100%',
              zIndex: 20,
              paddingLeft: '0.7%',
            }}
            onClick={() => setInHoldMode(false)}
          >
            <KhangScrollBar dates={dates} setSelectedDate={setSelectedDate} />
          </Box>
        )}
        <Box
          sx={{
            backgroundColor: 'black',
            width: '6px',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: '0.7%',
            zIndex: 10,
            '&:hover': {
              cursor: 'pointer',
            },
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
        <AutoSizer>
          {({ height, width }: { height: number; width: number }) => (
            <List
              width={width}
              height={height}
              ref={listRef}
              deferredMeasurementCache={cache}
              rowHeight={cache.rowHeight}
              rowRenderer={renderRow}
              rowCount={dates.length}
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

export default TimelineTab
