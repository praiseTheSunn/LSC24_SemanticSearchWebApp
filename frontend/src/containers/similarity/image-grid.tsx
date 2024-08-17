// // import React, { useEffect } from 'react';
// import AutoSizer from 'react-virtualized-auto-sizer'
// import { FixedSizeGrid as Grid } from 'react-window'
// import { AnImage } from '../../components'
// import { useAppSelector, useAppDispatch } from '../../AppState'
// import { useLazyGetImagesQuery } from '../../AppState';

// const ImageGrid = ({ cellHeight, cell } : {
//   cellHeight?: number,
//   cell?: any
// }) => {
//   cellHeight = cellHeight ? cellHeight : 125 // Default cell height

//   const simData = useAppSelector((state) => state.app.data); // Update selector if necessary

//   const columnCount = 9 // Number of columns in the grid
//   console.log('simData:', simData);

//   const Cell = ({ columnIndex, rowIndex, style } : {
//     columnIndex: number,
//     rowIndex: number,
//     style: React.CSSProperties
//   }) => {
//     const index = rowIndex * columnCount + columnIndex
//     if (index >= simData.length) return null // Ensure not to exceed simData length

//     const data = simData[index]
 
//     return (
//       <div style={style}>
//         <div className="h-full overflow-hidden p-0.5">
//           <AnImage key={index} data={data} index={index} />
//         </div>
//       </div>
//     )
//   }
//   // const data = simData[0]
//   // console.log('Rendering image data:', data);

//   cell = cell ? cell : Cell

//   return (

//     <div className="h-full w-full">
//       {/* <div> {JSON.stringify(simData[0])} </div> */}
//       {/* <div>{JSON.stringify(simData.slice(0, 5), null, 2)}</div> Hiển thị 5 phần tử đầu tiên */}
//       <AutoSizer>
//         {({ height, width }) => {
//           const columnWidth = width / columnCount - 1.5
//           const rowHeight = cellHeight // Making rows square by setting row height equal to column width
//           const rowCount = Math.ceil(simData.length / columnCount)
//           console.log('data', simData)
//           console.log('hello world')
//           return (
//             <Grid
//               columnCount={columnCount}
//               columnWidth={columnWidth}
//               height={height}
//               rowCount={rowCount}
//               rowHeight={rowHeight}
//               width={width}
//             >
//               {cell}
//             </Grid>
//           )
//         }}
//       </AutoSizer>
//     </div>
//   )
// }

// export default ImageGrid;
import React from 'react';
import { Grid as MuiGrid, useTheme, useMediaQuery } from '@mui/material';
import { AnImage } from '../../components';
import { useAppSelector } from '../../AppState';

const ImageGrid = ({ cellHeight, cell } : {
  cellHeight?: number,
  cell?: any
}) => {
  cellHeight = cellHeight ? cellHeight : 125; // Default cell height

  const simData = useAppSelector((state) => state.app.data); // Update selector if necessary

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const columnCount = isSmallScreen ? 3 : 9; // Adjust column count based on screen size

  console.log('simData:', simData);

  const Cell = ({ columnIndex, rowIndex, style } : {
    columnIndex: number,
    rowIndex: number,
    style: React.CSSProperties
  }) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= simData.length) return null; // Ensure not to exceed simData length

    const data = simData[index];

    return (
      // <div style={{ ...style, height: cellHeight, overflow: 'hidden' }}>
      //   <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      //     <AnImage
      //       key={index}
      //       data={data}
      //       // style={{ width: '100%', height: '100%', objectFit: 'contain' }} // Adjust the styling for AnImage
      //     />
      //   </div>
      // </div>
      <div style={{ ...style, height: cellHeight, overflow: 'hidden' }}>
        <div className="h-full overflow-hidden p-0.5">
          <AnImage key={index} data={data} index={index} />
        </div>
      </div>
    );
  };

  cell = cell ? cell : Cell;

  return (
    <MuiGrid container spacing={1}>
      {simData.map((data, index) => (
        <MuiGrid item xs={12 / columnCount} key={index}>
          {React.createElement(cell, { columnIndex: index % columnCount, rowIndex: Math.floor(index / columnCount), style: {} })}
        </MuiGrid>
      ))}
    </MuiGrid>
  );
};

export default ImageGrid;
