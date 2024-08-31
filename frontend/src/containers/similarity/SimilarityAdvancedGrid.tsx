import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid as Grid } from 'react-window';
import { ImageGroup } from '../../components';
import { useEffect, useState } from 'react';
import type { ImageRecord } from '../../types/image';
import { useAppSelector } from '../../AppState';

interface SimialrityAdvancedGridProps {
  tabindex: number;
}

const SimialrityAdvancedGrid: React.FC<SimialrityAdvancedGridProps> = ({ tabindex }) => {

  const [locationBasedData, setLocationBasedData] = useState<ImageRecord[][]>([]);
  const [timeBasedData, setTimeBasedData] = useState<ImageRecord[][]>([]);
  const data = useAppSelector((state) => state.app.data);

  useEffect(() => {
    const locationDataMap = new Map()
    const timeDataMap = new Map()


    for (const item of data) {
      const location = item.location_displayed
      if (!locationDataMap.has(location)) {
        locationDataMap.set(location, [])
      }
      locationDataMap.get(location).push(item)
    
      const date = item.date
      if (!timeDataMap.has(date)) {
        timeDataMap.set(date, [])
      }
      timeDataMap.get(date).push(item)
    }

    for (const value of locationDataMap.values()) {
      value.sort((a: ImageRecord, b: ImageRecord) => b?.score - a?.score);
    }
    for (const value of timeDataMap.values()) {
      value.sort((a: ImageRecord, b: ImageRecord) => b?.score - a?.score);
    }

    setLocationBasedData(Array.from(locationDataMap.values()))
    setTimeBasedData(Array.from(timeDataMap.values()))
  }, [data])

  // let totalItems: number = 0;
  // totalItems: number = 0;
  const glob_columnCount: number = 9;

  const cellRenderer = ({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
    const displayData = tabindex === 2 ? locationBasedData : timeBasedData;
    const item: ImageRecord[] = displayData?.[rowIndex * glob_columnCount + columnIndex];
    if (!item) return null;

    return (
      <div style={{ ...style}}>
      <div style={{ margin: '0 2px' }}> {/* Thêm margin vào bên trong */}
        <ImageGroup
          images={item}
          title={tabindex === 2 ? item[0]?.location_displayed : item[0]?.date}
        />
      </div>
    </div>
    );
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100%' 
    }}
    >
      <AutoSizer>
        {({ height, width }: { height: number; width: number }) => {
          const columnCount: number = glob_columnCount;
          const cellWidth: number = width / columnCount - 1.5;
          const cellHeight: number = 240;
          
          const displayData = tabindex === 2 ? locationBasedData : timeBasedData;
          console.log('displayData:', displayData, 'rerender');
          const rowCount: number = Math.ceil(displayData.length / columnCount);
          return (
            <Grid
              columnCount={columnCount}
              columnWidth={cellWidth}
              height={height}
              rowCount={rowCount}
              rowHeight={cellHeight}
              width={width}
              itemData={displayData}
              overscanRowCount={3}
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