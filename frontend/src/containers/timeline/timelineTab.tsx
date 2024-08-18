import React, { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../AppState'


import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  List,
  ListRowProps,
  ListRowRenderer,
} from 'react-virtualized'
import {
  ActivityIcon,
  ActivityIconActive,
  LocationIcon,
  LocationIconActive,
} from '../../assets'
import KhangScrollBar from '../../components/KhangScrollBar'
import ImageGroup from '../../components/imageGroup'
import ImageSingle from '../../components/imageSingle'
import ActivityBar from '../../components/activityBar'
import type {  ImageRecord, TimelineTabActivityRowData, TimelineTabActivityData, TimelineTabLocationRowData, TimelineTabLocationData, TimelineTabActivityAllData, TimelineTabLocationAllData } from '../../types/image'
import { Box, Typography, IconButton } from '@mui/material';

// const imageUrl = "https://www.yourcelebritymagazines.com/cdn/shop/files/A360_TAYLORSWIFT_TTPD_COV_APR_2024_V2_80_copy_1800x1800_1602402a-efde-486d-b22b-bc1c6bd7cfa5.webp?v=1713265674"

const TimelineTab = () => {
  const [typeOfIndex, setTypeOfIndex] = useState<number[]>([0])               // 0 location, 1 activity, State to track whether the button is held down 
  const [holdActive, setHoldActive] = useState(false)                         // State to track whether the button is held down
  const [holdTimer, setHoldTimer] = useState<string | number | ReturnType<typeof setTimeout> | undefined>(undefined)
  const [selectedDate, setSelectedDate] = useState<string|null>(null)
  const [inHoldMode, setInHoldMode] = useState(false)
  const [dates, setDates] = useState<string[]>([])
  const [selectedActivityIDs, setSelectedActivityIDs] = useState<(number | null)[]>([])
  const data = useAppSelector((state) => state.app.data)
  console.log('data', data)
  const [locationBasedData, setLocationBasedData] = useState<TimelineTabLocationAllData>(new Map())
  const [activityBasedData, setActivityBasedData] = useState<TimelineTabActivityAllData>(new Map())

  useEffect(() => {
    const initialSelectedActivityIDs = dates.map(() => null)
    setSelectedActivityIDs(initialSelectedActivityIDs)
  }, [dates])

  const listRef = useRef<List | null>(null)

  const ImageGroupMemorized = React.memo(ImageGroup)

  const cache = new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 250,
  })


  // Handler for mouse down event
  const handleMouseDown = () => {
    console.log('Mouse down detected')
    // Set hold active state to true
    setHoldActive(true)

    // Set a timer for the hold duration (e.g., 500 milliseconds)
    const timer = setTimeout(() => {
      // Perform action after holding for specified time
      console.log('Click and hold detected')
      // Here you can define what action to take when the hold is long enough
      doClickAndHoldAction()
    }, 500) // Adjust time as needed

    setHoldTimer(timer)
  }


  // Handler for mouse up event
  const handleMouseUp = () => {
    // Clear the timer and reset hold state
    clearTimeout(holdTimer)
    setHoldActive(false)
  }


  // Handler for mouse leave event
  const handleMouseLeave = () => {
    // Clear the timer and reset hold state
    clearTimeout(holdTimer)
    setHoldActive(false)
  }


  // Function to perform when click and hold is triggered
  const doClickAndHoldAction = () => {
    console.log('Action to perform after hold')
    // Add any action you want to execute here
    setInHoldMode(true)
  }


  useEffect(() => {
    // Parse data into location-based and activity-based data
    const locationDataByDate: TimelineTabLocationAllData = new Map()
    const activityDataByDate: TimelineTabActivityAllData = new Map()

    for (const dataRecord of data) {
      const date = dataRecord.date
      const location_id = dataRecord.location_id
      const location = dataRecord.location_displayed
      const activity_id = dataRecord.activity_id
      const activity = dataRecord.activity

      // Location-based data
      const rowLocationData = locationDataByDate.get(date)        
      // case: the date is not in the map yet   
      if (rowLocationData === undefined) {
        locationDataByDate.set(date, new Map<number, TimelineTabLocationData>())
        locationDataByDate.get(date)?.set(location_id, { location, images: [dataRecord] })
      }
      else {
        const singleLocationData = rowLocationData.get(location_id)
        // case: the date is already in the map but the location_id is not in the array yet
        if (singleLocationData === undefined) {
          rowLocationData.set(location_id, { location, images: [dataRecord] })
        }
        // case: the location_id is already in the array
        else {
          singleLocationData.images.push(dataRecord)
        }
      }
    
      // Activity-based data
      const rowActivityData = activityDataByDate.get(date)
      // case: the date is not in the map yet      
      if (rowActivityData === undefined) {
        activityDataByDate.set(date, new Map<number, TimelineTabActivityData>())
        activityDataByDate.get(date)?.set(activity_id, { activity, images: [dataRecord] })
      }
      else {
        const singleActivityData = rowActivityData.get(activity_id)
        // case: the date is already in the map but the activity_id is not in the array yet
        if (singleActivityData === undefined) {
          rowActivityData.set(activity_id, { activity, images: [dataRecord] })
        }
        // case: the activity_id is already in the array
        else {
          singleActivityData.images.push(dataRecord)
        }
      }
    }

    // in each date of the locationDataByDate and activityDataByDate, sort location_id/activity ascending 
    for (const [_, rowLocationData] of locationDataByDate) {
      const rowLocationDataSorted = new Map([...rowLocationData.entries()].sort((a, b) => a[0] - b[0]))
      locationDataByDate.set(_, rowLocationDataSorted)
    }
    for (const [_, rowActivityData] of activityDataByDate) {
      const rowActivityDataSorted = new Map([...rowActivityData.entries()].sort((a, b) => a[0] - b[0]))
      activityDataByDate.set(_, rowActivityDataSorted)
    }    

    // keep locationDataByDate and activityDataByDate as Map but sort the keys (dates) ascending
    const locationDataByDateSorted = new Map([...locationDataByDate.entries()].sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()))
    const activityDataByDateSorted = new Map([...activityDataByDate.entries()].sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()))
    console.log('locationDataByDateSorted', locationDataByDateSorted)
    console.log('activityDataByDateSorted', activityDataByDateSorted)

    // Update state
    setLocationBasedData(locationDataByDate)
    setActivityBasedData(activityDataByDate)

    // sort dates ascending
    const dates = Array.from(locationDataByDate.keys()).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    )
    setDates(dates)

    const initialTypeOfIndex = dates.map(() => 0)
    setTypeOfIndex(initialTypeOfIndex)
  }, [data])

  useEffect(() => {
    cache.clearAll()
    listRef.current?.recomputeRowHeights()
  }, [locationBasedData, activityBasedData])

  useEffect(() => {
    if (selectedDate && listRef.current) {
      const index = dates.indexOf(selectedDate)
      if (index !== -1) {
        listRef.current.scrollToRow(index)
        // console.log('ref', listRef.current);
      }
    }
  }, [selectedDate])

  const handleChangeTypeOfIndex = (index: number) => {
    const newTypeOfIndex = [...typeOfIndex]
    newTypeOfIndex[index] = newTypeOfIndex[index] === 0 ? 1 : 0
    console.log('index', index, newTypeOfIndex)
    setTypeOfIndex(newTypeOfIndex)
  }

  const renderRow : ListRowRenderer = ( {index, key, style, parent, isScrolling}: ListRowProps) => {
    const currentDate = dates[index]
    const rowLocationData: TimelineTabLocationRowData = locationBasedData.get(currentDate) || new Map()
    const rowActivityData: TimelineTabActivityRowData = activityBasedData.get(currentDate) || new Map()

    // Filter the data based on the selected activity_id for this row
    const selectedActivityID = selectedActivityIDs[index]
    const filteredActivityData: TimelineTabActivityRowData = selectedActivityID
      ? new Map<number, TimelineTabActivityData>([
          [selectedActivityID, rowActivityData.get(selectedActivityID) as TimelineTabActivityData]
        ])
      : rowActivityData;

    // // Sort activities in rowActivityData based on time of the first image in each activity
    // rowActivityData.sort(
    //   (a: TimelineTabActivityData, b: TimelineTabActivityData) => {
    //     const minTimeA = Math.min(...a.images.map(img => Number(img.time)));
    //     const minTimeB = Math.min(...b.images.map(img => Number(img.time)));
    //     return minTimeA - minTimeB;
    //   }
    // );

    return (
      <CellMeasurer
        key={key}
        cache={cache}
        parent={parent}
        columnIndex={0}
        rowIndex={index}
      >
        {({ registerChild }) => (
          <Box
            ref={registerChild}
            sx = {{...style,
              display: 'flex',
              flexDirection: 'row',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                width: 25,
                height: 25,
                zIndex: 10,
                backgroundColor: 'black',
                marginRight: 2,
                borderRadius: '50%',
              }}
            />

            <Box
              sx={{
                width: '96%',
                minHeight: 100,
                boxShadow: '0px 2px #D7D7D7',
                borderRadius: 2,
                transition: 'width 0.5s',
                mb: 2,
                position: 'relative',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 'bold', minWidth: 200 }}
                >
                  {currentDate}
                </Typography>

                <IconButton
                  onClick={() => handleChangeTypeOfIndex(index)}
                  sx={{ marginRight: 1 }}
                >
                  <img
                    alt="location-icon"
                    src={
                      typeOfIndex[index] === 1
                        ? LocationIcon
                        : LocationIconActive
                    }
                  />
                </IconButton>

                <IconButton
                  onClick={() => handleChangeTypeOfIndex(index)}
                  sx={{ marginRight: 1 }}
                >
                  <img
                    alt="activity-icon"
                    src={
                      typeOfIndex[index] === 0
                        ? ActivityIcon
                        : ActivityIconActive
                    }
                  />
                </IconButton>

                <ActivityBar
                  rowData={rowActivityData}
                  visibility={typeOfIndex[index] === 1 ? 'visible' : 'hidden'}
                  onActivitySelect={(activity_id) => {
                    const newSelectedActivityIDs = [...selectedActivityIDs];
                    newSelectedActivityIDs[index] = activity_id;
                    setSelectedActivityIDs(newSelectedActivityIDs);
                  }}
                />
              </Box>

              {/* Location data */}
              {typeOfIndex[index] === 0 && (
                <Box
                  className="image-day-images"
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 1,
                    marginBottom: 3,
                    marginLeft: 2,
                  }}
                >
                  {Array.from(rowLocationData.entries()).map(([location_id, location_item]) => (
                    <Box sx={{ width: 170, height: 230 }} key={location_id}>
                      <ImageGroupMemorized
                        sortType={1}
                        images={location_item.images}
                        title={location_item.location}
                      />
                    </Box>
                  ))}
                </Box>
              )}

              {/* Activity data */}
              {typeOfIndex[index] === 1 && (
                <Box 
                  className="image-day-images"
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 1,
                    marginBottom: 3,
                    marginLeft: 2,
                  }} 
                >
                  {filteredActivityData.size === 1 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1 }}>
                      {Array.from(filteredActivityData.values())[0].images.map((imageItem: ImageRecord) => (
                        <ImageSingle key={imageItem.id} image={imageItem} />
                      ))}
                    </Box>
                  ) : (
                    Array.from(filteredActivityData.entries()).map(([activity_id, activity_item]) => (
                      <Box sx={{ width: 170, height: 230 }} key={activity_id}>
                        <ImageGroupMemorized
                          sortType={1}
                          images={activity_item.images}
                          title={activity_item.activity}
                        />
                      </Box>
                    ))
                  )}
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
          height: 'calc(100% - 40px)',
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
          {( {height, width} : {height: number, width: number}) => (
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
