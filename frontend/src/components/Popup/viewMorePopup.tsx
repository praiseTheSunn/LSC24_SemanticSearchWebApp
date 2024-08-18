import { useEffect, useRef, useState } from 'react';
import { AutoSizer, Grid } from 'react-virtualized';
import { Box, Typography, IconButton } from '@mui/material';
import AnImage from '../AnImage';
import closeIcon from '../../assets/close.png'

const ViewMorePopup = ({
  viewImages,
  title,
  setOpenViewMore,
  columnCount,
  rowToDisplay,
} : {
  viewImages: any;
  title: string;
  setOpenViewMore: any;
  columnCount?: number;
  rowToDisplay?: number;
}) => {
  columnCount = columnCount ? columnCount : 8; // Number of columns in the grid
  rowToDisplay = rowToDisplay ? rowToDisplay : 4; // Number of rows to display in the grid

  const Cell = ({ columnIndex, rowIndex, style } : { columnIndex: number; rowIndex: number, style: any }) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= viewImages.length) return null; // Ensure not to exceed simData length

    const data = viewImages[index];

    return (
      <Box sx={{ width: '100%', maxHeight: '100%', objectFit: 'contain', p: 1 }} style={style}>
        <AnImage key={index} data={data} index={index} />
      </Box>
    );
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10000,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          width: '95%',
          height: '92%',
          backgroundColor: 'white',
          borderRadius: '16px',
          pb: 3,
        }}
      >
        <Box sx={{ width: '100%', height: '100%', flexGrow: 0, flexShrink: 0, overflow: 'hidden' }}>
          <Typography variant="h6" align="center" sx={{ pt: 2, pb: 1, fontWeight: 'bold' }}>
            {title}
          </Typography>
          <Box sx={{ position: 'relative', width: '100%', overflowY: 'auto', height: '570px', maxHeight: '570px' }}>
            <Box sx={{ height: '100%', width: '100%' }}>
              <AutoSizer>
                {({ height, width }) => {
                  const columnWidth = width / columnCount - 1.5;
                  const rowCount = Math.ceil(viewImages.length / columnCount);
                  const rowHeight = height / rowToDisplay;

                  return (
                    <Grid
                      columnCount={columnCount}
                      columnWidth={columnWidth}
                      height={height}
                      rowCount={rowCount}
                      rowHeight={rowHeight}
                      width={width}
                      cellRenderer={Cell}
                    />
                  );
                }}
              </AutoSizer>
            </Box>
          </Box>
        </Box>
        <Box 
        sx={{ position: 'absolute', top: '-1.7%', right: '-0.7%', height: '30px', width: '30px', padding: '5px', backgroundColor: 'white', borderRadius: '9999px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', zIndex: 10000 }}
        
        >
          <Box
            src={closeIcon}
            component='img'
            onClick={() => setOpenViewMore(false)}
            alt="close"
            sx={{ height: '100%', width: '100%', cursor: 'pointer', zIndex: 10001, position: 'relative' }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ViewMorePopup;
