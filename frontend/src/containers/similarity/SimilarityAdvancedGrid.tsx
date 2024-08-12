import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid as Grid } from 'react-window';
import { ImageGroup } from '../../components';
import './similarity.css';
import React, { useEffect, useState } from 'react';
import type { ImageRecord } from '../../types/image';

interface SimialrityAdvancedGridProps {
  data: ImageRecord[];
  tabindex: number;
}

const SimialrityAdvancedGrid: React.FC<SimialrityAdvancedGridProps> = ({ data, tabindex }) => {
  const ImageGroupMemoized = React.memo(ImageGroup);
  const [locationBasedData, setLocationBasedData] = useState<ImageRecord[][]>([]);
  const [timeBasedData, setTimeBasedData] = useState<ImageRecord[][]>([]);

  useEffect(() => {
    const locationDataMap = new Map<string, ImageRecord[]>();
    const timeDataMap = new Map<string, ImageRecord[]>();

    // data.forEach((item) => {
    //   const location = item.location_displayed;
    //   if (!locationDataMap.has(location)) {
    //     locationDataMap.set(location, []);
    //   }
    //   locationDataMap.get(location)!.push(item);

    //   const date = item.date;
    //   if (!timeDataMap.has(date)) {
    //     timeDataMap.set(date, []);
    //   }
    //   timeDataMap.get(date)!.push(item);
    // });

    for (const item of data) {
      const location = item.location_displayed;
      if (!locationDataMap.has(location)) {
        locationDataMap.set(location, []);
      }
      // locationDataMap.get(location)!.push(item);
      const locationArray = locationDataMap.get(location) ?? [];
      locationArray.push(item);
      locationDataMap.set(location, locationArray);

      const date = item.date;
      if (!timeDataMap.has(date)) {
        timeDataMap.set(date, []);
      }
      // timeDataMap.get(date)!.push(item);
      const timeArray = timeDataMap.get(date) ?? [];
      timeArray.push(item);
      timeDataMap.set(date, timeArray);
    }

    // locationDataMap.forEach((value) => value.sort((a, b) => b.score - a.score));
    for (const value of locationDataMap.values()) {
      value.sort((a, b) => b.score - a.score);
    }
    
    // timeDataMap.forEach((value) => value.sort((a, b) => b.score - a.score));
    for (const value of timeDataMap.values()) {
      value.sort((a, b) => b.score - a.score);
    }

    setLocationBasedData(Array.from(locationDataMap.values()));
    setTimeBasedData(Array.from(timeDataMap.values()));
  }, [data]);

  // let totalItems: number = 0;
  // totalItems: number = 0;
  const [totalItems, setTotalItems] = useState<number>(0);
  const glob_columnCount: number = 8;

  const cellRenderer = ({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
    const displayData = tabindex === 2 ? locationBasedData : timeBasedData;
    const item: ImageRecord[] = displayData?.[rowIndex * glob_columnCount + columnIndex];
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
    <div className="image-location w-full h-full">
      <AutoSizer>
        {({ height, width }: { height: number; width: number }) => {
          const columnCount: number = glob_columnCount;
          const cellWidth: number = 180;
          const cellHeight: number = 230;

          const displayData = tabindex === 1 ? locationBasedData : timeBasedData;
          const rowCount: number = Math.ceil(displayData.length / columnCount);
          // totalItems = displayData.length;
          setTotalItems(displayData.length);
          return (
            <Grid
              columnCount={columnCount}
              columnWidth={cellWidth}
              height={height}
              rowCount={rowCount}
              rowHeight={cellHeight}
              width={width}
              itemData={displayData}
              style={{ margin: '' }}
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