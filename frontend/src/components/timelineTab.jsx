import { useEffect, useState } from 'react';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import './timelineTab.css';
import { ActivityIcon, ActivityIconActive, LocationIcon, LocationIconActive } from '../../assets';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';

const cache = new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 100
  });

const TimelineTab = ({ data }) => {
    useEffect(() => {
        data.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [data]);

    const [typeOfIndex, setTypeOfIndex] = useState([]); //0 location, 1 activity
    useEffect(() => {
        const typeOfIndex = new Array(data.length).fill(0);
        setTypeOfIndex(typeOfIndex);
    }, [data]);

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

                return(<div ref={registerChild} className='flex flex-row relative' style={style}>
                    <div className='rounded-full bg-black mr-7' style={{ width: "25px", height: "25px", zIndex:"10" }}/>
                    
                    <div className='flex flex-col mb-4' style={{ width: "96%", minHeight: '100px', boxShadow:"0px 2px #D7D7D7", borderRadius: "10px"}}>
                        <div className=''>
                            <div className='w-full flex flex-row'> 
                                <h3 className="vertical-timeline-element-title font-bold" style={{ fontSize: "22px", minWidth: "200px" }}>
                                    {data[index].date}
                                </h3>
                                <img src={typeOfIndex[index] === 1 ? LocationIcon : LocationIconActive} style={{ marginRight: "10px" }} onClick={() => handleChangeTypeOfIndex(index)}/>
                                <img src={typeOfIndex[index] === 0 ? ActivityIcon : ActivityIconActive} style={{ marginRight: "10px" }} onClick={() => handleChangeTypeOfIndex(index)}/>
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

    return(
        <div className='h-full w-full overflow-hidden'>
            <div className='w-full h-full mx-0 pb-0 pt-4 relative'>
                <div className='vertical-line w-1 h-full absolute top-0 left-[0.7%] bg-black'/>
                <AutoSizer>
                    {({ height, width }) => (
                        <List
                        width={width}
                        height={height}
                        deferredMeasurementCache={cache}
                        rowHeight={cache.rowHeight}
                        rowRenderer={renderRow}
                        rowCount={data.length}
                        overscanRowCount={3}
                        style={{}}
                        />
                    )}
                </AutoSizer>
            </div>
        </div>
    )


};

export default TimelineTab;