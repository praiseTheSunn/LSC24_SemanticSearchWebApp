import { useEffect, useRef, useState } from 'react';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import './timelineTab.css';
import { ActivityIcon, ActivityIconActive, LocationIcon, LocationIconActive } from '../../assets';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';
import Scrollbar from '../../components/scrollbar';
import { KhangScrollBar } from '../../components';

const cache = new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 100
  });

const TimelineTab = ({ data }) => {

    const [typeOfIndex, setTypeOfIndex] = useState([]); //0 location, 1 activity
    // State to track whether the button is held down
    const [holdActive, setHoldActive] = useState(false);
    const [holdTimer, setHoldTimer] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [inHoldMode, setInHoldMode] = useState(false);
    const [dates, setDates] = useState([]);
    const listRef = useRef(null);

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
        data.sort((a, b) => new Date(a.date) - new Date(b.date));
        const typeOfIndex = new Array(data.length).fill(0);
        setTypeOfIndex(typeOfIndex);
        const dates = data.map((item) => item.date);
        setDates(dates);
    }, [data]);

    useEffect(() => {
        if (selectedDate && listRef.current) {
            const index = dates.indexOf(selectedDate);
            if (index !== -1) {
                listRef.current.scrollToRow(index);
                console.log('ref', listRef.current);
            }
        }
    }, [selectedDate, dates]);

    const handleChangeTypeOfIndex = (index) => {
        
        const newTypeOfIndex = [...typeOfIndex];
        newTypeOfIndex[index] = newTypeOfIndex[index] === 0 ? 1 : 0;
        console.log('index', index, newTypeOfIndex);
        setTypeOfIndex(newTypeOfIndex);
    };

    function renderRow({ index, key, style, parent, isScrolling }) {
        return (
            <CellMeasurer
            key={key}
            cache={cache}
            parent={parent}
            columnIndex={0}
            rowIndex={index}
            >
                {({ registerChild }) => {

                return(<div ref={registerChild} className='flex flex-row relative ' style={style}>
                    <div className='rounded-full bg-black mr-7' style={{ width: "25px", height: "25px", zIndex:"10" }}/>
                    
                    <div className='flex flex-col mb-4' 
                    style={{ width: "96%", minHeight: '100px', boxShadow:"0px 2px #D7D7D7", borderRadius: "10px", transition: "width 0.5s"}}>
                        <div className=''>
                            <div className='w-full flex flex-row'> 
                                <h3 className="vertical-timeline-element-title font-bold" style={{ fontSize: "22px", minWidth: "200px" }}>
                                    {data[index].date}
                                </h3>
                                <img src={typeOfIndex[index] === 1 ? LocationIcon : LocationIconActive} style={{ marginRight: "10px", cursor: "pointer" }} onClick={() => handleChangeTypeOfIndex(index)}/>
                                <img src={typeOfIndex[index] === 0 ? ActivityIcon : ActivityIconActive} style={{ marginRight: "10px", cursor: "pointer" }} onClick={() => handleChangeTypeOfIndex(index)}/>
                                <div>Thanh trạng thái </div>
                            </div>
                        </div>
                        
                        
                        {typeOfIndex[index] === 0 ? (
                            <div></div>
                        ) : (
                            <div></div>
                        )}

                    </div>
                    
                </div>
                )}}
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
                    <div className='bg-white absolute top-0 left-0 opacity-95 w-full h-full z-20 pl-[0.7%]'>
                        <KhangScrollBar dates={dates} setSelectedDate={setSelectedDate}/>
                    </div>
                )}
                <div className='vertical-line w-[6px] h-full absolute top-0 left-[0.7%] bg-black z-10'
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
                        rowCount={data.length}
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