import React, { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector, timelineActions } from '../../AppState'
import { ImageRecord, TimelineTabActivityData, TimelineTabLocationData, TimelineTabActivityRowData, TimelineTabLocationRowData, TimelineTabActivityAllData, TimelineTabLocationAllData } from '../../types/image'

import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  List,
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

interface TimelineTabProps {
  data: ImageRecord[]
}

// const imageUrl = "https://www.yourcelebritymagazines.com/cdn/shop/files/A360_TAYLORSWIFT_TTPD_COV_APR_2024_V2_80_copy_1800x1800_1602402a-efde-486d-b22b-bc1c6bd7cfa5.webp?v=1713265674"

const TimelineTab: React.FC<TimelineTabProps> = ({ data }) => {
  const dispatch = useAppDispatch()
  const selectedDate: string | null = useAppSelector(
    (state) => state.timeline.selectedDate
  )
  const inHoldMode: boolean = useAppSelector(
    (state) => state.timeline.inHoldMode
  )
  // const locationBasedData: TimelineTabLocationAllData = useAppSelector(
  //   (state) => state.timeline.locationBasedData
  // )
  // const activityBasedData: TimelineTabActivityAllData = useAppSelector(
  //   (state) => state.timeline.activityBasedData
  // )

  const assignSelectedDate = React.useCallback((data: string | null) => {
    dispatch(timelineActions.setSelectedDate(data));
  }, [dispatch]);

  const assignInHoldMode = React.useCallback((data: boolean) => {
    dispatch(timelineActions.setInHoldMode(data));
  }, [dispatch]);

  // const assignLocationBasedData = React.useCallback((data: TimelineTabLocationAllData) => {
  //   dispatch(timelineActions.setLocationBasedData(data));
  // }, [dispatch]);

  // const assignActivityBasedData = React.useCallback((data: TimelineTabActivityAllData) => {
  //   dispatch(timelineActions.setActivityBasedData(data));
  // }, [dispatch]);


  const [typeOfIndex, setTypeOfIndex] = useState<number[]>([0])               // 0 location, 1 activity  
  const [holdActive, setHoldActive] = useState(false)                         // State to track whether the button is held down
  const [holdTimer, setHoldTimer] = useState<string | number | ReturnType<typeof setTimeout> | undefined>(undefined)
  const [dates, setDates] = useState<string[]>([])
  const [selectedActivityIDs, setSelectedActivityIDs] = useState<(number | null)[]>([])
  // const [selectedDate, setSelectedDate] = useState(null)
  // const [inHoldMode, setInHoldMode] = useState(false)
  const [locationBasedData, setLocationBasedData] = useState<TimelineTabLocationAllData>(new Map())
  const [activityBasedData, setActivityBasedData] = useState<TimelineTabActivityAllData>(new Map())

  useEffect(() => {
    const initialSelectedActivityIDs = dates.map(() => null)
    setSelectedActivityIDs(initialSelectedActivityIDs)
  }, [dates])

  const listRef = useRef(null)

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
    assignInHoldMode(true)
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
      const sortedLocationData = new Map([...rowLocationData.entries()].sort((a, b) => a[0] - b[0]))
      locationDataByDate.set(_, sortedLocationData)
    }
    for (const [_, rowActivityData] of activityDataByDate) {
      const sortedActivityData = new Map([...rowActivityData.entries()].sort((a, b) => a[0] - b[0]))
      activityDataByDate.set(_, sortedActivityData)
    }    
    console.log('sorted locationDataByDate', locationDataByDate)
    console.log('sorted activityDataByDate', activityDataByDate)

    // Update state
    setLocationBasedData(locationDataByDate)
    setActivityBasedData(activityDataByDate)

    // sort dates ascending
    const dates = Array.from(locationDataByDate.keys()).sort(
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

  const renderRow = ( index: number, key: any, style: any, parent: any, isScrolling: boolean ) => {
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
          <div
            ref={registerChild}
            className="flex flex-row relative"
            style={style}
          >
            <div
              className="rounded-full bg-black mr-7"
              style={{ width: '25px', height: '25px', zIndex: '10' }}
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
                    rowData={rowActivityData}
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
                  {Array.from(rowLocationData.entries()).map(([location_id, location_item]) => (
                    <div className="w-[170px] h-[230px]" key={location_id}>
                      <ImageGroupMemorized
                        sortType={1}
                        images={location_item.images}
                        title={location_item.location}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Activity data */}
              {typeOfIndex[index] === 1 && (
                <div className="image-day-images relative mb-3 ml-2 flex flex-row flex-wrap gap-x-2">
                  {filteredActivityData.size === 1 ? (
                    // If there is only one activity, display all images in a single row
                    <div className="flex flex-row flex-wrap gap-x-2">
                      {Array.from(filteredActivityData.values())[0].images.map((imageItem: ImageRecord) => (
                        <ImageSingle key={imageItem.id} image={imageItem} />
                      ))}
                    </div>
                  ) : (
                    // Otherwise, display images in ImageGroups
                    <div className="flex flex-row flex-wrap gap-x-2">
                      {Array.from(filteredActivityData.entries()).map(([activity_id, activity_item]) => (
                        <div className="w-[170px] h-[230px]" key={activity_id}>
                          <ImageGroupMemorized
                            sortType={1}
                            images={activity_item.images}
                            title={activity_item.activity}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CellMeasurer>
    )
  }

  useEffect(() => {
    assignInHoldMode(false)
  }, [selectedDate])

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="w-full h-full mx-0 pb-0 pt-4 relative">
        {inHoldMode && (
          <div
            className="bg-white absolute top-0 left-0 opacity-95 w-full h-full z-20 pl-[0.7%]"
            onClick={() => assignInHoldMode(false)}
          >
            <KhangScrollBar dates={dates} setSelectedDate={assignSelectedDate} />
          </div>
        )}
        <div
          className="vertical-line w-[6px] h-full absolute top-0 left-[0.7%] bg-black z-10 hover:cursor-pointer"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
        <AutoSizer>
          {( height: number, width: number) => (
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
      </div>
    </div>
  )
}

export default TimelineTab
