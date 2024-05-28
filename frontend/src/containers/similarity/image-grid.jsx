import React, { useEffect } from 'react';
import { useState } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { AnImage } from '../../components';
import './similarity.css';
import NeighborPopup from '../../components/Popup/neighborPopup';
import imageService from '../../services/imageService';

    const columnCount = 9; // Number of columns in the grid

    const [showNeighborPopup, setShowNeighborPopup] = useState(false);
    const [imageToShowPopup, setImageToShowPopup] = useState(null);
    const [neighborData, setNeighborData] = useState(null);

    // const handleDoubleClick = (src) => {
    //     setImageToShowPopup(src);
    //     setShowNeighborPopup(true);
    // }

    // const handleClosePopup = () => {
    //     setShowNeighborPopup(false);
    // };

    // useEffect(() => {
    //     if (showNeighborPopup && imageToShowPopup) {
    //         imageService.getNeighbors(imageToShowPopup).then((response) => {
    //             console.log('image neighbors', response.data);
    //             setNeighborData(response.data.response);
    //         });
    //     }
    // }, [showNeighborPopup, imageToShowPopup]);

    // console.log('ne')

    const Cell = ({ columnIndex, rowIndex, style }) => {
        const index = rowIndex * columnCount + columnIndex;
        if (index >= simData.length) return null; // Ensure not to exceed simData length

        const data = simData[index];

        return (
            <div style={style} className="max-h-[142px]">
                <div className="h-auto image-item overflow-hidden" >
                    <AnImage 
                        key={index} 
                        src={data.img_link} 
                        date={data.date} 
                        index={index} 
                        time={data.time} 
                        // onDoubleClick={() => handleDoubleClick(data.img_link)}
                    />
                </div>
            </div>
        );
    };

    cell = cell ? cell : Cell;

    return (
        <div className="h-full w-full">
            <AutoSizer>
                {({ height, width }) => {
                    const columnWidth = width / columnCount - 1.5;
                    const rowHeight = cellHeight; // Making rows square by setting row height equal to column width
                    const rowCount = Math.ceil(simData.length / columnCount);

                    return (
                        <>
                        <Grid
                            columnCount={columnCount}
                            columnWidth={columnWidth}
                            height={height}
                            rowCount={rowCount}
                            rowHeight={rowHeight}
                            width={width}
                        >
                            {cell}
                        </Grid>
                        {/* {showNeighborPopup && 
                            <NeighborPopup 
                                viewImage={imageToShowPopup}  
                                neighborsData={neighborData}
                                onClose={handleClosePopup}
                            />
                        } */}
                        </>
                    );
                }}
            </AutoSizer>
        </div>
    );
};

export default ImageGrid;
