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

import './neighborPopup.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeGrid as Grid } from 'react-window'
import closeIcon from '../../assets/close.png'
import { AnImage, ObjectDetail } from '..'
// import imageService from '../../services/imageService'
import React from 'react'
import { appActions, useAppDispatch, useAppSelector, useGetNeighborsQuery, useLazyGetImagesQuery } from '../../AppState'
import { Box } from '@mui/material'

const NeighborPopup = ({ viewImage, onClose, cellHeight, cell } : {viewImage: any, onClose: any, cellHeight?: number, cell?: any}) => {
  console.log('viewImage', viewImage) 
  const result = useGetNeighborsQuery(viewImage)
  const { data, error, isError, isFetching } = result;
  const neighborsData = !isFetching && !isError && data ? data : [];
  console.log('neighborsData', neighborsData)

  return (
    <div className="single-popup-container">
      <div className="popup-content-background row">
        <div className="single-images-container col">
          <h1 className="py-2">Neighbor Images</h1>
          <div className="flex h-full">
          <div className="grid-container">
            {neighborsData.map((data: any, index: number) => (
              <img key={index} src={data.img_link} alt={`Neighbor ${index}`} className="grid-item" />
            ))}
          </div>
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
