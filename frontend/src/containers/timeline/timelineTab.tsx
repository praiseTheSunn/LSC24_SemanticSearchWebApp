import React, { useEffect, useRef, useState } from 'react'
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
import type {  TimelineTabActivityRowData, TimelineTabActivityData, TimelineTabLocationRowData, TimelineTabLocationData } from '../../types/image'
import { useAppSelector } from '../../AppState'
import { Box } from '@mui/material'

// const imageUrl = "https://www.yourcelebritymagazines.com/cdn/shop/files/A360_TAYLORSWIFT_TTPD_COV_APR_2024_V2_80_copy_1800x1800_1602402a-efde-486d-b22b-bc1c6bd7cfa5.webp?v=1713265674"

const TimelineTab = () => {
  const [typeOfIndex, setTypeOfIndex] = useState<number[]>([0])              //0 location, 1 activity
  // State to track whether the button is held down
  const [holdActive, setHoldActive] = useState(false)
  const [holdTimer, setHoldTimer] = useState<string | number | ReturnType<typeof setTimeout> | undefined>(undefined)
  const [selectedDate, setSelectedDate] = useState<string|null>(null)
  const [inHoldMode, setInHoldMode] = useState(false)
  const [dates, setDates] = useState<string[]>([])
  const [locationBasedData, setLocationBasedData] = useState<TimelineTabLocationRowData>({})
  const [activityBasedData, setActivityBasedData] = useState<TimelineTabActivityRowData>({})
  const [selectedActivityIDs, setSelectedActivityIDs] = useState<(number | null)[]>([])
  const data = useAppSelector((state) => state.app.data)

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
    const locationDataMap = new Map();
    const activityDataMap = new Map();
    
    for (const item of data) {
      if (item.date === '2019-01-12') {
        console.log('item', item);
      }
      // Location-based data
      if (!locationDataMap.has(item.date)) {
        locationDataMap.set(item.date, []);
      }
      const locationData = locationDataMap.get(item.date);
      if (!locationData.some((data: TimelineTabLocationData) => data.location_id === item.location_id)) {
        locationData.push({ location_id: item.location_id, images: [item] });
      } else {
        const existingLocation = locationData.find(
          (data: TimelineTabLocationData) => data.location_id === item.location_id
        );
        existingLocation.images.push(item);
      }
    
      // Activity-based data
      if (!activityDataMap.has(item.date)) {
        activityDataMap.set(item.date, []);
      }
      const activityData = activityDataMap.get(item.date);
      if (!activityData.some((data: TimelineTabActivityData) => data.activity_id === item.activity_id)) {
        activityData.push({
          activity_id: item.activity_id,
          activity: item.activity,
          images: [item],
        });
      } else {
        const existingActivity = activityData.find(
          (data: TimelineTabActivityData) => data.activity_id === item.activity_id
        );
        existingActivity.images.push(item);
      }
    }
    
    // in each date of the map, sort location_id and activity_id ascending 
    for (const key of Object.keys(locationDataMap)) {
      locationDataMap.get(key).sort((a: TimelineTabLocationData, b: TimelineTabLocationData) =>
        a.location_id - b.location_id
      );
    }
    for (const key of Object.keys(activityDataMap)) {
      activityDataMap.get(key).sort((a: TimelineTabActivityData, b: TimelineTabActivityData) =>
        a.activity_id - b.activity_id
      );
    }
    console.log('locationDataMap', locationDataMap);
    console.log('activityDataMap', activityDataMap);

    // Update state
    setLocationBasedData(locationDataMap)
    setActivityBasedData(activityDataMap)

    // sort dates ascending
    const dates = Array.from(locationDataMap.keys()).sort(
      (a, b) => new Date(a).getDate() - new Date(b).getDate(),
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
    const locationData = locationBasedData[currentDate] || []
    const activityData = activityBasedData[currentDate] || []

    // Filter the data based on the selected activity_id for this row
    const selectedActivityID = selectedActivityIDs[index]
    const filteredActivityData = selectedActivityID
      ? activityData.filter((item: TimelineTabActivityData) => item.activity_id === selectedActivityID)
      : activityData

    // Sort activities in activityData based on time of the first image in each activity
    activityData.sort(
      (a: TimelineTabActivityData, b: TimelineTabActivityData) => {
        const minTimeA = Math.min(...a.images.map(img => Number(img.time)));
        const minTimeB = Math.min(...b.images.map(img => Number(img.time)));
        return minTimeA - minTimeB;
      }
    );

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
              sx={{ width: '25px', height: '25px', zIndex: '10', backgroundColor: 'black', marginRight: '28px', borderRadius: '9999px' }}
            />

            <div
              className="flex flex-col mb-4 relative"
              style={{
                width: '96%',
                minHeight: '100px',
                boxShadow: '0px 2px #D7D7D7',
                borderRadius: '10px',
                transition: 'width 0.5s',
              }}
            >
              <div className="">
                <div className="w-full flex flex-row">
                  <h3
                    className="vertical-timeline-element-title font-bold"
                    style={{ fontSize: '22px', minWidth: '200px' }}
                  >
                    {currentDate}
                  </h3>
                  <img
                    alt="location-icon"
                    src={
                      typeOfIndex[index] === 1
                        ? LocationIcon
                        : LocationIconActive
                    }
                    style={{ marginRight: '10px', cursor: 'pointer' }}
                    onClick={() => handleChangeTypeOfIndex(index)}
                  />
                  <img
                    alt="activity-icon"
                    src={
                      typeOfIndex[index] === 0
                        ? ActivityIcon
                        : ActivityIconActive
                    }
                    style={{ marginRight: '10px', cursor: 'pointer' }}
                    onClick={() => handleChangeTypeOfIndex(index)}
                  />

                  <ActivityBar
                    data={activityData}
                    visibility={typeOfIndex[index] === 1 ? 'visible' : 'hidden'}
                    onActivitySelect={(activity_id) => {
                      const newSelectedActivityIDs = [...selectedActivityIDs]
                      newSelectedActivityIDs[index] = activity_id
                      setSelectedActivityIDs(newSelectedActivityIDs)
                    }}
                  />
                </div>
              </div>

              {/* Location data */}
              {typeOfIndex[index] === 0 && (
                <div className="image-day-images relative mb-3 ml-2 flex flex-row flex-wrap gap-x-2">
                  {locationData.map((locationItem, locationIndex) => (
                    <div className="w-[170px] h-[230px]" key={locationIndex}>
                      <ImageGroupMemorized
                        sortType={1}
                        images={locationItem.images}
                        title={locationItem.images[0].location_displayed}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Activity data */}
              {typeOfIndex[index] === 1 && (
                <div className="image-day-images relative mb-3 ml-2 flex flex-row flex-wrap gap-x-2">
                  {filteredActivityData.length === 1 ? (
                    // If there is only one activity, display all images in a single row
                    <div className="flex flex-row flex-wrap gap-x-2">
                      {filteredActivityData[0].images.map((imageItem) => (
                        <ImageSingle key={imageItem.id} image={imageItem} />
                      ))}
                    </div>
                  ) : (
                    // Otherwise, display images in ImageGroups
                    <div className="flex flex-row flex-wrap gap-x-2">
                      {filteredActivityData.map(
                        (activityItem, activityIndex) => (
                          <ImageGroupMemorized
                            key={activityIndex}
                            images={activityItem.images}
                            title={activityItem.images[0].activity}
                            sortType={1}
                          />
                        ),
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
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
          height: '100%',
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
