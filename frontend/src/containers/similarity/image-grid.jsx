import React from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { AnImage } from '../../components';
import './similarity.css';

const ImageGrid = ({ simData, cellHeight, cell }) => {
    cellHeight = cellHeight ? cellHeight : 120; // Default cell height

    const columnCount = 9; // Number of columns in the grid

    const Cell = ({ columnIndex, rowIndex, style }) => {
        const index = rowIndex * columnCount + columnIndex;
        if (index >= simData.length) return null; // Ensure not to exceed simData length

        const data = simData[index];

        return (
            <div style={style} >
                <div className="h-full image-item overflow-hidden w-full">
                    <AnImage key={index} src={data.img_link} date={data.date} index={index} time={data.time} />
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
                    );
                }}
            </AutoSizer>
        </div>
    );
};

export default ImageGrid;
