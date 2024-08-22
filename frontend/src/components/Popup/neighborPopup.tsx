// import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
// import AutoSizer from 'react-virtualized-auto-sizer';
// import { FixedSizeGrid as Grid } from 'react-window';
// import closeIcon from '../../assets/close.png';
// import { AnImage } from '../../components';
// import imageService from '../../services/imageService';

// interface NeighborPopupProps {
//   viewImage: string;
//   onClose: (value: boolean) => void;
//   [key: string]: any; 
// }

// // interface NeighborData {
// //   img_link: string;
// // }

// interface NeighborData {
//   img_link: string;
//   [key: string]: any; 
// }

// const NeighborPopup: FC<NeighborPopupProps> = ({ viewImage, onClose }) => {
//   const [neighborsData, setNeighborsData] = useState<NeighborData[]>([]);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [hasScrolled, setHasScrolled] = useState<boolean>(false);
//   const viewImageRef = useRef<HTMLDivElement | null>(null);
//   const gridRef = useRef<any>(null);
//   const previousScrollTop = useRef<number>(0);

//   const fetchNeighbors = useCallback(async (imageId: string, pageNum: number, position: 'start' | 'end') => {
//     setIsLoading(true);
//     try {
//       const response = await imageService.getNeighbors(imageId, pageNum);
//       const newNeighbors: NeighborData[] = response.data.response;
//       const middleIndex = Math.floor(newNeighbors.length / 2);
//       const frontNeighbors = newNeighbors.slice(0, middleIndex);
//       const backNeighbors = newNeighbors.slice(middleIndex);

//       setNeighborsData((prev) => {
//         if (imageId === viewImage) return newNeighbors;
//         if (position === 'start') {
//           return [...frontNeighbors, ...prev];
//         }
//         return [...prev, ...backNeighbors];
//       });
//     } catch (error) {
//       console.error('Error fetching neighbors:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [viewImage]);

//   useEffect(() => {
//     fetchNeighbors(viewImage, 1, 'end');
//   }, [viewImage, fetchNeighbors]);

//   useEffect(() => {
//     if (viewImageRef.current && !hasScrolled) {
//       viewImageRef.current.scrollIntoView({
//         behavior: 'smooth',
//         block: 'center',
//       });
//       setHasScrolled(true);
//     }
//   }, [neighborsData, viewImage, hasScrolled]);

//   const handleScroll = ({ scrollTop }: { scrollTop: number }) => {
//     const scrollDirection = scrollTop < previousScrollTop.current ? 'backward' : 'forward';
//     previousScrollTop.current = scrollTop;

//     if (scrollDirection === 'backward' && scrollTop === 0 && !isLoading) {
//       const firstImage = neighborsData[0]?.img_link;
//       if (firstImage) {
//         fetchNeighbors(firstImage, 1, 'start');
//       }
//     }

//     if (scrollDirection === 'forward' && !isLoading) {
//       const grid = gridRef.current;
//       if (grid) {
//         const { scrollHeight, clientHeight } = grid._outerRef;
//         if (scrollTop + clientHeight >= scrollHeight) {
//           const lastImage = neighborsData[neighborsData.length - 1]?.img_link;
//           if (lastImage) {
//             fetchNeighbors(lastImage, 1, 'end');
//           }
//         }
//       }
//     }
//   };

//   const Cell: FC<{ columnIndex: number; rowIndex: number; style: React.CSSProperties }> = ({ columnIndex, rowIndex, style }) => {
//     const index = rowIndex * columnCount + columnIndex;
//     const data = neighborsData[index];
//     if (!data) return null;

//     const { img_link } = data;
//     const isHighlighted = img_link === viewImage;
//     return (
//       <div
//         style={style}
//         className={`image-wrapper-neighbor ${isHighlighted ? 'highlight' : ''}`}
//         ref={isHighlighted ? viewImageRef : null}
//       >
//         <div className="h-full overflow-hidden p-0.5">
//           <AnImage key={index} index={index} data={data} />
//         </div>
//       </div>
//     );
//   };

//   const columnCount: number = 8;
//   const itemSize: number = 180;

//   return (
//     <div
//       className="fixed top-0 left-0 flex flex-col justify-center items-center bg-black bg-opacity-50 h-full w-full"
//       style={{ zIndex: '1000000' }}
//     >
//       <div className="relative flex flex-row items-center w-[90%] h-[90%] bg-white rounded-2xl">
//         <div className="max-h-[90%] h-full w-full overflow-y-hidden flex-shrink-0 flex-grow-0 flex-auto">
//           <h1 className="font-bold text-center max-h-[600px]">Neighbors</h1>
//           <div className="w-full h-full">
//             {neighborsData.length > 0 ? (
//               <AutoSizer>
//                 {({ height, width }) => {
//                   const columnWidth = width / columnCount;
//                   const rowHeight = 130;
//                   const rowCount = Math.ceil(neighborsData.length / columnCount);

//                   return (
//                     <Grid
//                       columnCount={columnCount}
//                       columnWidth={columnWidth}
//                       height={height}
//                       rowCount={rowCount}
//                       rowHeight={rowHeight}
//                       width={width}
//                       onScroll={({ scrollTop }) => handleScroll({ scrollTop })}
//                       ref={gridRef}
//                     >
//                       {Cell}
//                     </Grid>
//                   );
//                 }}
//               </AutoSizer>
//             ) : (
//               <div>Loading neighbors...</div>
//             )}
//           </div>
//         </div>

//         <div
//           className="absolute top-[-1.7%] right-[-0.7%] w-8 h-8 bg-white rounded-full flex justify-center items-center cursor-pointer p-[5px]"
//           onClick={() => onClose(true)}
//         >
//           <img
//             src={closeIcon}
//             className="close-popup-button"
//             onClick={() => onClose(true)}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default NeighborPopup;
import { Box } from '@mui/material'
import { AnImage, ObjectDetail } from '..'
import { React, FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeGrid as Grid } from 'react-window'

import './neighborPopup.css'
import closeIcon from '../../assets/close.png'
import { appActions, useAppDispatch, useAppSelector, useLazyGetNeighborsQuery, useLazyGetImagesQuery } from '../../AppState'

const NeighborPopup = ({ viewImage, onClose, cellHeight, cell } : {viewImage: any, onClose: any, cellHeight?: number, cell?: any}) => {
  const [triggerGetNeighbors, { data, error, isError, isFetching }] = useLazyGetNeighborsQuery();
  const neighborsData = !isFetching && !isError && data ? data : [];
  
  // Trigger lazy query when the component mounts or when `viewImage` changes
  useEffect(() => {
    if (viewImage) {
      triggerGetNeighbors(viewImage); // Trigger the lazy query
    }
  }, [viewImage, triggerGetNeighbors]);

  console.log('neighborsData', neighborsData)

  const gridRowGap = '3px'
  const Cell = ({ columnIndex, rowIndex, style } : {
    columnIndex: number,
    rowIndex: number,
    style: React.CSSProperties
  }) => {
    const index = rowIndex * columnCount + columnIndex
    if (index >= neighborsData.length) return null // Ensure not to exceed simData length

    const data = neighborsData[index]
    const { img_link } = data;
    const isHighlighted = img_link === viewImage;
    return (        
      <div style={style} className={`image-wrapper-neighbor ${isHighlighted ? 'highlight' : ''}`}>
        <Box sx={{ height: `calc(${style.height}px - 2 * ${gridRowGap})`, position: 'relative', overflow: 'hidden', padding: gridRowGap}} >
          <AnImage key={index} data={data} index={index} />
        </Box>
      </div>
    )
  }

  cell = cell ? cell : Cell
  const columnCount: number = 8;
  const itemSize: number = 180;
  const columnGap = 20; 
  cellHeight = cellHeight ? cellHeight : 105 // Default cell height
  
  return (
    <div className="single-popup-container">
      <div 
        className="popup-content-background row"
        style={{ display: 'flex', flexDirection: 'row', backgroundColor: '#f0f0f0', padding: '1rem' }}
      >
        <div 
          className="single-images-container col"
          style={{ flexDirection: 'column', flex: 1 }}
        >
          <h1 
            className="py-2"
            style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
          >
            Neighbor Images
          </h1>
          <div 
            className="flex h-full"
            style={{ display: 'flex', height: '80%' }}
          >
                  <Box sx={{ width: '95dvw'}}>
                    <AutoSizer>
                      {({ height, width }) => {
                        const columnWidth = width / columnCount - 2.5
                        const rowHeight = cellHeight + 2 // Making rows square by setting row height equal to column width
                        const rowCount = Math.ceil(neighborsData.length / columnCount)

                        return (
                          <Grid
                            columnCount={columnCount}
                            columnWidth={columnWidth}
                            height={height}
                            rowCount={rowCount}
                            rowHeight={rowHeight}
                            width={width}
                            overscanRowCount={3}
                            style={{ gap: `${columnGap}px` }}
                          >
                            {cell}
                          </Grid>
                        )
                      }}
                    </AutoSizer>
                  </Box>
            {/* </div> */}
          </div>
        </div>
        <div className="close-button-container">
          <img
            src={closeIcon}
            className="close-popup-button"
            alt="close button"
            onClick={() => onClose(true)}
          />
        </div>
      </div>
    </div>
  )
  
}

export default NeighborPopup