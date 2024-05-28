import React, { useEffect, useState, memo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { ImageGroup } from '../../components';
import './similarity.css'; // Assuming you need this CSS for styling

const SimialrityAdvancedGrid = ({ data, tabindex }) => {
    const ImageGroupMemoized = memo(ImageGroup);
    const [locationBasedData, setLocationBasedData] = useState([]);
    const [timeBasedData, setTimeBasedData] = useState([]);

    useEffect(() => {
        const locationDataMap = new Map();
        const timeDataMap = new Map();

        data.forEach((item) => {
            const location = item.location_displayed;
            if (!locationDataMap.has(location)) {
                locationDataMap.set(location, []);
            }
            locationDataMap.get(location).push(item);

            const date = item.date;
            if (!timeDataMap.has(date)) {
                timeDataMap.set(date, []);
            }
            timeDataMap.get(date).push(item);
        });

        locationDataMap.forEach((value) => value.sort((a, b) => b.score - a.score));
        timeDataMap.forEach((value) => value.sort((a, b) => b.score - a.score));

        setLocationBasedData(Array.from(locationDataMap.values()));
        setTimeBasedData(Array.from(timeDataMap.values()));
    }, [data]);

    let totalItems = 0;
    let glob_columnCount = 8;

    const cellRenderer = ({ columnIndex, rowIndex, style }) => {
        const displayData = tabindex === 2 ? locationBasedData : timeBasedData;
        const item = displayData?.[rowIndex * glob_columnCount + columnIndex];
        // if (item === undefined) console.log('item undefined', item, rowIndex * glob_columnCount + columnIndex); 
        if (!item) return null;

        return (
            <div style={{ ...style, padding: '0 5px' }} className="image-cell">
                <ImageGroupMemoized
                    images={item}
                    title={tabindex === 2 ? item[0]?.location_displayed : item[0]?.date}
                />
            </div>
        );
    };

    return (
        <div className='image-location w-full h-full'>
            <AutoSizer>
                {({ height, width }) => {
                    const columnCount = glob_columnCount; // Adjust this based on your requirements
                    const cellWidth = 180;
                    const cellHeight = 230; // Adjust this based on your image group height

                    const displayData = tabindex === 1 ? locationBasedData : timeBasedData;
                    const rowCount = Math.ceil(displayData.length / columnCount);
                    totalItems = displayData.length;
                    return (
                        <Grid
                            columnCount={columnCount}
                            columnWidth={cellWidth}
                            height={height}
                            rowCount={rowCount}
                            rowHeight={cellHeight}
                            width={width}
                            itemData={displayData}
                            style={{margin: ""}}
                        >
                            {cellRenderer}
                        </Grid>
                    );
                }}
            </AutoSizer>
        </div>
    );
};

export default SimialrityAdvancedGrid;
