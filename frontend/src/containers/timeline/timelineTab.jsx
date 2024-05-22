import React, { useEffect, useRef, useState } from 'react';
import { ActivityIcon, ActivityIconActive, LocationIcon, LocationIconActive } from '../../assets';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';
import { KhangScrollBar } from '../../components';
import { ImageGroup } from '../../components';
import { ImageSingle } from '../../components';
import ActivityBar from '../../components/activityBar';

// const imageUrl = "https://www.yourcelebritymagazines.com/cdn/shop/files/A360_TAYLORSWIFT_TTPD_COV_APR_2024_V2_80_copy_1800x1800_1602402a-efde-486d-b22b-bc1c6bd7cfa5.webp?v=1713265674"

const TimelineTab = ({ data }) => {

    const [typeOfIndex, setTypeOfIndex] = useState([]); //0 location, 1 activity
    // State to track whether the button is held down
    const [holdActive, setHoldActive] = useState(false);
    const [holdTimer, setHoldTimer] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [inHoldMode, setInHoldMode] = useState(false);
    const [dates, setDates] = useState([]);
    const [locationBasedData, setLocationBasedData] = useState({});
    const [activityBasedData, setActivityBasedData] = useState({});
    const [selectedActivities, setSelectedActivities] = useState([]);
    useEffect(() => {
        const initialSelectedActivities = dates.map(() => null);
        setSelectedActivities(initialSelectedActivities);
    }, [dates]);
    const listRef = useRef(null);

    const ImageGroupMemorized = React.memo(ImageGroup);

    const cache = new CellMeasurerCache({
        fixedWidth: true,
        defaultHeight: 250
    });

    // Handler for mouse down event
    const handleMouseDown = () => {
        console.log('Mouse down detected');
        // Set hold active state to true
        setHoldActive(true);

        // Set a timer for the hold duration (e.g., 500 milliseconds)
        const timer = setTimeout(() => {
            // Perform action after holding for specified time
            console.log('Click and hold detected');
            // Here you can define what action to take when the hold is long enough
            doClickAndHoldAction();
        }, 500);  // Adjust time as needed

        setHoldTimer(timer);
    };

    // Handler for mouse up event
    const handleMouseUp = () => {
        // Clear the timer and reset hold state
        clearTimeout(holdTimer);
        setHoldActive(false);
    };

    // Handler for mouse leave event
    const handleMouseLeave = () => {
        // Clear the timer and reset hold state
        clearTimeout(holdTimer);
        setHoldActive(false);
    };

    // Function to perform when click and hold is triggered
    const doClickAndHoldAction = () => {
        console.log('Action to perform after hold');
        // Add any action you want to execute here
        setInHoldMode(true);
    };


    useEffect(() => {
        // Parse data into location-based and activity-based data
        const locationDataMap = new Map();
        const activityDataMap = new Map();

        data.forEach((item) => {
            if (item.date === '2019-01-12') {
                console.log('item', item);
            }
            // Location-based data
            if (!locationDataMap.has(item.date)) {
                locationDataMap.set(item.date, []);
            }
            const locationData = locationDataMap.get(item.date);
            if (!locationData.some((data) => data.location_id === item.location_id)) {
                locationData.push({ location_id: item.location_id, images: [item] });
            } else {
                const existingLocation = locationData.find((data) => data.location_id === item.location_id);
                existingLocation.images.push(item);
            }

            // Activity-based data
            if (!activityDataMap.has(item.date)) {
                activityDataMap.set(item.date, []);
            }
            const activityData = activityDataMap.get(item.date);
            if (!activityData.some((data) => data.activity_id === item.activity_id)) {
                activityData.push({ activity_id: item.activity_id, images: [item] });
            } else {
                const existingActivity = activityData.find((data) => data.activity_id === item.activity_id);
                existingActivity.images.push(item);
            }
        });

        
        //sort location_id and activity_id ascending in each date of the map
        locationDataMap.forEach((value, key) => {
            value.sort((a, b) => a.location_id - b.location_id);
        });
        activityDataMap.forEach((value, key) => {
            value.sort((a, b) => a.activity_id - b.activity_id);
        });
        console.log('locationDataMap', locationDataMap);
        console.log('activityDataMap', activityDataMap);

        // Update state
        setLocationBasedData(locationDataMap);
        setActivityBasedData(activityDataMap);

        //sort dates ascending
        const dates = Array.from(locationDataMap.keys()).sort((a, b) => new Date(a) - new Date(b));
        setDates(dates);

        

        const initialTypeOfIndex = dates.map(() => 0);
        setTypeOfIndex(initialTypeOfIndex);
    }, [data]);

    useEffect(() => {
        cache.clearAll();
        listRef.current && listRef.current.recomputeRowHeights();
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

    const handleChangeTypeOfIndex = (index) => {
        
        const newTypeOfIndex = [...typeOfIndex];
        newTypeOfIndex[index] = newTypeOfIndex[index] === 0 ? 1 : 0;
        console.log('index', index, newTypeOfIndex);
        setTypeOfIndex(newTypeOfIndex);
    };

    const renderRow = ({ index, key, style, parent, isScrolling })  => {
        const currentDate = dates[index];
        const locationData = locationBasedData.get(currentDate) || [];
        const activityData = activityBasedData.get(currentDate) || [];

        // Filter the data based on the selected activity ID for this row
        const selectedActivity = selectedActivities[index];
        // console.log('selectedActivities', selectedActivities)
        const filteredActivityData = selectedActivity ? activityData.filter(item => item.activity === selectedActivity) : activityData;

        // Sort activities in activityData based on time of the first image in each activity
        activityData.sort((a, b) => 
            Math.min(a.images.map(img => Object.values(img)[0].time)) - Math.min(b.images.map(img => Object.values(img)[0].time))
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
                    <div ref={registerChild} className="flex flex-row relative" style={style}>
                        <div className="rounded-full bg-black mr-7" style={{ width: "25px", height: "25px", zIndex: "10" }} />
                        
                        <div className="flex flex-col mb-4 relative" style={{ width: "96%", minHeight: '100px', boxShadow: "0px 2px #D7D7D7", borderRadius: "10px", transition: "width 0.5s" }}>
                            <div className="">
                                <div className="w-full flex flex-row">
                                    <h3 className="vertical-timeline-element-title font-bold" style={{ fontSize: "22px", minWidth: "200px" }}>
                                        {currentDate}
                                    </h3>
                                    <img alt='location-icon' src={typeOfIndex[index] === 1 ? LocationIcon : LocationIconActive} style={{ marginRight: "10px", cursor: "pointer" }} onClick={() => handleChangeTypeOfIndex(index)} />
                                    <img alt='activity-icon' src={typeOfIndex[index] === 0 ? ActivityIcon : ActivityIconActive} style={{ marginRight: "10px", cursor: "pointer" }} onClick={() => handleChangeTypeOfIndex(index)} />
                                    <ActivityBar
                                        data={activityData}
                                        visibility={typeOfIndex[index] === 1 ? "visible" : "hidden"}
                                        onActivitySelect={(activity) => {
                                            const newSelectedActivities = [...selectedActivities];
                                            newSelectedActivities[index] = activity;
                                            setSelectedActivities(newSelectedActivities);
                                        }} 
                                    />
                                </div>
                            </div>
                            
                            {/* Location data */}
                            {typeOfIndex[index] === 0 && (
                                <div className="image-day-images relative mb-3 ml-2 flex flex-row flex-wrap gap-x-2">
                                    {locationData.map((locationItem, locationIndex) => (
                                        <div className='w-[180px] h-[230px]' key={locationIndex}>
                                            <ImageGroupMemorized
                                                sortType={1}
                                                images={locationItem.images}
                                                title={locationItem.images[0].location}
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
                                                <ImageSingle
                                                    image={imageItem}
                                                    title={filteredActivityData[0].activity}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        // Otherwise, display images in ImageGroups
                                        <div className="flex flex-row flex-wrap gap-x-2">
                                            {filteredActivityData.map((activityItem, activityIndex) => (
                                                <ImageGroupMemorized
                                                    key={activityIndex}
                                                    images={activityItem.images}
                                                    title={activityItem.images[0].activity}
                                                    sortType={1}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CellMeasurer>
        );
    }

    useEffect(() => {
        setInHoldMode(false);
    }, [selectedDate]); 

    return(
        <div className='h-full w-full overflow-hidden'>
            <div className='w-full h-full mx-0 pb-0 pt-4 relative'>
                {inHoldMode && (
                    <div className='bg-white absolute top-0 left-0 opacity-95 w-full h-full z-20 pl-[0.7%]' onClick={() => setInHoldMode(false)}>
                        <KhangScrollBar dates={dates} setSelectedDate={setSelectedDate}/>
                    </div>
                )}
                <div className='vertical-line w-[6px] h-full absolute top-0 left-[0.7%] bg-black z-10 hover:cursor-pointer'
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}    
                />
                <AutoSizer>
                    {({ height, width }) => (
                        <List
                        width={width}
                        height={height}
                        ref={listRef}
                        deferredMeasurementCache={cache}
                        rowHeight={cache.rowHeight}
                        rowRenderer={renderRow}
                        rowCount={dates.length}
                        overscanRowCount={3}
                        scrollToAlignment='center'
                        style={{transition: "transform ease-in-out 0.5s"}}
                        />
                    )}
                </AutoSizer>
            </div>
        </div>
    )


};

export default TimelineTab;