import { useEffect, useRef, useState } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { AutoSizer } from 'react-virtualized';
import { Box, Typography, IconButton } from '@mui/material';
import AnImage from '../AnImage';
import closeIcon from '../../assets/close.png'
import { Config } from '..';

const ViewMorePopup = ({
  viewImages,
  title,
  setOpenViewMore,
  columnCount,
  cellHeight,
} : {
  viewImages: any;
  title: string;
  setOpenViewMore: any;
  columnCount?: number;
  cellHeight?: number;
}) => {
  columnCount = columnCount ? columnCount : Config.ViewMorePopupColumnCount; // Number of columns in the grid
  cellHeight = cellHeight ? cellHeight : Config.ViewMorePopupCellHeight; // Height of each cell in the grid

  const Cell = ({ columnIndex, rowIndex, style } : { columnIndex: number; rowIndex: number, style: any }) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= viewImages.length) return null; // Ensure not to exceed simData length

    const data = viewImages[index];

    return (
      <div
        style={{
          ...style,
        }}
      >
        <Box sx={{ height: `calc(${style.height}px - 2 * ${Config.gridRowGap})`, position: 'relative', overflow: 'hidden', padding: Config.gridRowGap}} >
          <AnImage key={index} data={data} index={index} />
        </Box>
      </div>
    );
  };
  

  return (
    <Box
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        height: '100%', 
        width: '100%', 
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        zIndex: 50000 
      }}
    >
      <Box
        sx={{ 
          display: 'flex', 
          flexDirection: 'row', 
          width: '95%', 
          height: '95%', 
          backgroundColor: 'white', 
          borderRadius: '20px', 
          position: 'relative', 
          top: '10px' 
        }}
      >
        <Box
          sx={{ flexDirection: 'column', flex: 1 }}
        >
          <h2
          style={{ paddingTop: '0.1rem', paddingBottom: '0.1rem', textAlign: 'center' }}>
            {title}
          </h2>
          <Box 
          sx={{ 
            display: 'flex', 
            height: '85%',
          }}
            >
            <Box sx={{ width: '95vw' }}>
              <AutoSizer>
                {({ height, width }) => {
                  const columnWidth = width / columnCount - 1.5
                  const rowHeight = cellHeight + 2
                  const rowCount = Math.ceil(viewImages.length / columnCount);

                  // console.log('height:', height, 'width:', width, 'columnWidth:', columnWidth, 'rowHeight:', rowHeight, 'rowCount:', rowCount);
                  return (
                    <Grid
                      columnCount={columnCount}
                      columnWidth={columnWidth}
                      height={height}
                      rowCount={rowCount}
                      rowHeight={rowHeight}
                      width={width}
                      overscanRowCount={5}
                      // style={{ gap: `${columnGap}px` }}
                    >
                      {Cell}
                    </Grid>
                  );
                }}
              </AutoSizer>
            </Box>
          </Box>
        </Box>
        <Box 
        sx = {{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '30px',
          width: '30px',
          padding: '5px',
          backgroundColor: 'white',
          position: 'absolute',
          top: '-1.7%',
          right: '-0.7%',
          borderRadius: '20px',
          cursor: 'pointer',
          zIndex: 10000,
        }}
        >
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
          <img
            src={closeIcon}
            // className="close-popup-button"
            style={{  cursor: 'pointer',
              position: 'relative',
              height: '100%',
              width: '100%',
              zIndex: 1000,}}
            alt="close button"
            onClick={() => setOpenViewMore(false)}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ViewMorePopup;
