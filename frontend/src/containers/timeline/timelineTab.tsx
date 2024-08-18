import React, { type CSSProperties, useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../AppState'


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
import KhangScrollBar from '../../components/KhangScrollBar'
import ImageGroup from '../../components/imageGroup'
import ImageSingle from '../../components/imageSingle'
import ActivityBar from '../../components/activityBar'
import type {  ImageRecord, TimelineTabActivityRowData, TimelineTabActivityData, TimelineTabLocationRowData, TimelineTabLocationData, TimelineTabActivityAllData, TimelineTabLocationAllData } from '../../types/image'
import { Box, Typography, IconButton } from '@mui/material';
import { MeasuredCellParent } from 'react-virtualized/dist/es/CellMeasurer'

const ImageGroupMemorized = React.memo(ImageGroup)

const TimelineTab = () => {
  const data = useAppSelector((state) => state.app.data);

  const [typeOfIndex, setTypeOfIndex] = useState<number[]>([0])               // 0 location, 1 activity, State to track whether the button is held down 
const [holdActive, setHoldActive] = useState(false)                         // State to track whether the button is held down
const [holdTimer, setHoldTimer] = useState<string | number | ReturnType<typeof setTimeout> | undefined>(undefined)
const [selectedDate, setSelectedDate] = useState<string|null>(null)
const [inHoldMode, setInHoldMode] = useState(false)
const [dates, setDates] = useState<string[]>([])
const [selectedActivityIDs, setSelectedActivityIDs] = useState<(number | null)[]>([])
const [locationBasedData, setLocationBasedData] = useState<TimelineTabLocationAllData | null>(null)
const [activityBasedData, setActivityBasedData] = useState<TimelineTabActivityAllData | null>(null)

  useEffect(() => {
      const initialSelectedActivityIDs = dates.map(() => null);
      setSelectedActivityIDs(initialSelectedActivityIDs);
  }, [dates]);
  const listRef = useRef<List | null>(null)

  const ImageGroupMemorized = React.memo(ImageGroup);

  const cache = new CellMeasurerCache({
      fixedWidth: true,
      defaultHeight: 250
  });

  // Handler for mouse down event
  const handleMouseDown = () => {
      console.log('Mouse down detected');
      setHoldActive(true);

      const timer = setTimeout(() => {
          console.log('Click and hold detected');
          doClickAndHoldAction();
      }, 500);

      setHoldTimer(timer);
  };

  // Handler for mouse up event
  const handleMouseUp = () => {
      clearTimeout(holdTimer);
      setHoldActive(false);
  };

  // Handler for mouse leave event
  const handleMouseLeave = () => {
      clearTimeout(holdTimer);
      setHoldActive(false);
  };

  // Function to perform when click and hold is triggered
  const doClickAndHoldAction = () => {
      console.log('Action to perform after hold');
      setInHoldMode(true);
  };


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
        if (!locationData.some((data : any) => data.location_id === item.location_id)) {
            locationData.push({ location_id: item.location_id, images: [item] });
        } else {
            const existingLocation = locationData.find((data: any) => data.location_id === item.location_id);
            existingLocation.images.push(item);
        }

        // Activity-based data
        if (!activityDataMap.has(item.date)) {
            activityDataMap.set(item.date, []);
        }
        const activityData = activityDataMap.get(item.date);
        if (!activityData.some((data : any) => data.activity_id === item.activity_id)) {
            activityData.push({ activity_id: item.activity_id, activity: item.activity, images: [item] });
        } else {
            const existingActivity = activityData.find((data :any) => data.activity_id === item.activity_id);
            existingActivity.images.push(item);
        }
      }

      
      //sort location_id and activity_id ascending in each date of the map
      locationDataMap.forEach((value, key) => {
          value.sort((a : ImageRecord, b: ImageRecord) => a.location_id - b.location_id);
      });
      activityDataMap.forEach((value, key) => {
          value.sort((a : ImageRecord, b: ImageRecord) => a.activity_id - b.activity_id);
      });
      console.log('locationDataMap', locationDataMap);
      console.log('activityDataMap', activityDataMap);

      // Update state
      setLocationBasedData(locationDataMap);
      setActivityBasedData(activityDataMap);

      //sort dates ascending
      const dates = Array.from(locationDataMap.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      setDates(dates);

      

      const initialTypeOfIndex = dates.map(() => 0);
      setTypeOfIndex(initialTypeOfIndex);
  }, [data]);

  useEffect(() => {
      cache.clearAll();
      if(listRef.current)
        listRef?.current.recomputeRowHeights();
  }, [locationBasedData, activityBasedData]);

  useEffect(() => {
      if (selectedDate && listRef.current) {
          const index = dates.indexOf(selectedDate);
          if (index !== -1) {
              listRef.current.scrollToRow(index);
              // console.log('ref', listRef.current);
          }
      }
  }, [selectedDate]);

  const handleChangeTypeOfIndex = (index: number) => {
      
      const newTypeOfIndex = [...typeOfIndex];
      newTypeOfIndex[index] = newTypeOfIndex[index] === 0 ? 1 : 0;
      console.log('index', index, newTypeOfIndex);
      setTypeOfIndex(newTypeOfIndex);
  };


const renderRow : ListRowRenderer = ({
  index,
  key,
  style,
  parent,
  isScrolling
} : ListRowProps) => {
  const currentDate = dates[index];
  const locationData: any = locationBasedData?.get(currentDate) || [];
  const activityData: any = activityBasedData?.get(currentDate) || [];

  const selectedActivityID = selectedActivityIDs[index];
  const filteredActivityData = selectedActivityID ? activityData.filter((item: any) => item.activity_id === selectedActivityID) : activityData;

  activityData.sort((a: any, b: any) =>
    Math.min(a.images.map((img: any) => (Object.values(img)[0] as any).time)) - Math.min(b.images.map((img: any) => (Object.values(img)[0] as any).time))
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
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'row' }}>
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
                src={typeOfIndex[index] === 1 ? LocationIcon : LocationIconActive} 
                component="img" onClick={() => handleChangeTypeOfIndex(index)} 
                sx={{ marginRight: "10px", cursor: "pointer"  }}
              />
              <Box 
                src={typeOfIndex[index] === 0 ? ActivityIcon : ActivityIconActive} 
                component="img" 
                onClick={() => handleChangeTypeOfIndex(index)} 
                sx={{ marginRight: "10px", cursor: "pointer"  }}
              />

              <ActivityBar
                rowData={activityData}
                visibility={typeOfIndex[index] === 1 ? 'visible' : 'hidden'}
                onActivitySelect={(activity_id) => {
                  const newSelectedActivityIDs = [...selectedActivityIDs];
                  newSelectedActivityIDs[index] = activity_id;
                  setSelectedActivityIDs(newSelectedActivityIDs);
                }}
              />
            </Box>

            {typeOfIndex[index] === 0 && (
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
                {locationData.map((locationItem, locationIndex) => (
                  <Box key={locationIndex} sx={{ width: '170px', height: '230px' }}>
                    <ImageGroupMemorized
                      sortType={1}
                      images={locationItem.images}
                      title={locationItem.images[0].location_displayed}
                    />
                  </Box>
                ))}
              </Box>
            )}

            {typeOfIndex[index] === 1 && (
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
                {filteredActivityData.length === 1 ? (
                  <Box display="flex" flexDirection="row" flexWrap="wrap" gap="8px">
                    {filteredActivityData[0].images.map((imageItem) => (
                      <ImageSingle key={imageItem.id} image={imageItem} />
                    ))}
                  </Box>
                ) : (
                  <Box display="flex" flexDirection="row" flexWrap="wrap" gap="8px">
                    {filteredActivityData.map((activityItem, activityIndex) => (
                      <ImageGroupMemorized
                        key={activityIndex}
                        images={activityItem.images}
                        title={activityItem.images[0].activity}
                        sortType={1}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </CellMeasurer>
  );
};


  useEffect(() => {
      setInHoldMode(false);
  }, [selectedDate]); 

  return(
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


};

export default TimelineTab;