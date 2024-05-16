import React from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { AnImage } from '../../components';
import './similarity.css';

const ImageGrid = ({ simData }) => {
    const columnCount = 9; // Number of columns in the grid

    const Cell = ({ columnIndex, rowIndex, style }) => {
        const index = rowIndex * columnCount + columnIndex;
        if (index >= simData.length) return null; // Ensure not to exceed simData length

        const data = simData[index];

        return (
            <div style={style} className="max-h-[142px]">
                <div className="h-auto image-item overflow-hidden">
                    <AnImage key={index} src={data.img_link} date={data.date} index={index} time={data.time} />
                </div>
            </div>
        );
    };

    return (
        <div className="h-full w-full">
            <AutoSizer>
                {({ height, width }) => {
                    const columnWidth = width / columnCount;
                    const rowHeight = 130; // Making rows square by setting row height equal to column width
                    const rowCount = Math.ceil(simData.length / columnCount);

                    return (
                        <Grid
                            columnCount={columnCount}
                            columnWidth={columnWidth}
                            height={height}
                            rowCount={rowCount}
                            rowHeight={rowHeight}
                            width={width}
                        >
                            {Cell}
                        </Grid>
                    );
                }}
            </AutoSizer>
        </div>
    );
};

export default ImageGrid;
