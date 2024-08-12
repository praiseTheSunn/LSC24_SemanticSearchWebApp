import { useEffect, useRef, useState } from 'react'
import { AutoSizer, Grid } from 'react-virtualized'
import closeIcon from '../../assets/close.png'
import AnImage from '../AnImage'
import ImageInList from '../Image/imageInList'

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
  columnCount = columnCount ? columnCount : 8 // Number of columns in the grid
  rowToDisplay = rowToDisplay ? rowToDisplay : 4 // Number of rows to display in the grid

  const Cell = ({ columnIndex, rowIndex, style } : { columnIndex: number; rowIndex: number, style: any }) => {
    const index = rowIndex * columnCount + columnIndex
    if (index >= viewImages.length) return null // Ensure not to exceed simData length

    const data = viewImages[index]

    return (
      <div className="w-full max-h-full object-contain p-1" style={style}>
        <AnImage key={index} data={data} index={index} />
      </div>
    )
  }

  return (
    <div
      className="fixed top-0 left-0 h-full w-full flex flex-col justify-center items-center bg-black bg-opacity-50"
      style={{ zIndex: '10000' }}
    >
      <div className="absolute flex flex-row justify-center items-center w-[95%] h-[92%] bg-white rounded-2xl pb-3">
        <div className="w-full h-full flex-grow-0 flex-shrink-0 basis-auto overflow-hidden">
          <h4 className="font-tahoma font-bold text-center pt-8 pb-2">
            {title}
          </h4>
          <div className="relative w-full overflow-y-auto h-[570px] max-h-[570px]">
            <div className="h-full w-full">
              <AutoSizer>
                {({ height, width }) => {
                  const columnWidth = width / columnCount - 1.5
                  const rowCount = Math.ceil(viewImages.length / columnCount)
                  const rowHeight = height / rowToDisplay
                  console.log('autosizer heigh', height)

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
                  )
                }}
              </AutoSizer>
            </div>
          </div>
        </div>
        <div className="absolute top-[-1.7%] right-[-0.7%] h-[30px] w-[30px] p-[5px] bg-white rounded-full flex justify-center items-center cursor-pointer z-[10000]">
          <img
            src={closeIcon}
            className="cursor-pointer relative h-full w-full z-[10001]"
            onClick={() => setOpenViewMore(false)}
          />
        </div>
      </div>
    </div>
  )
}

export default ViewMorePopup
