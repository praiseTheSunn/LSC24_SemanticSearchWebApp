import React from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeGrid as Grid } from 'react-window'
import { AnImage } from '../../components'
import './richSimilarity.css'

const RichImageGrid = ({ simData }) => {
  const columnCount = 3 // Number of columns in the grid

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex
    if (index >= simData.length) return null // Ensure not to exceed simData length

    const data = simData[index]

    return (
      <div
        style={style}
        className="grid grid-cols-3 grid-rows-1 gap-1 pr-3 p-1"
      >
        {/* <div className="h-auto image-item overflow-hidden"> */}
        <div className="w-full h-full col-span-2  ">
          <AnImage key={index} data={data} index={index} />
        </div>
        <div className="w-full h-full col-span-1">
          <p>{data.ocr}</p>
          <p>{data.location_displayed}</p>
          <p>{data.caption}</p> {/* noun chunk */}
          {/* <p>{data.category}</p> */}
          {/* <p>{data.semantic_location}</p> */}
          {/* Add more information as needed */}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <AutoSizer>
        {({ height, width }) => {
          const columnWidth = width / columnCount
          const rowHeight = columnWidth / 2 // Making rows square by setting row height equal to column width
          const rowCount = Math.ceil(simData.length / columnCount)
          console.log('autosizer heigh', height)

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
          )
        }}
      </AutoSizer>
    </div>
  )
}

export default RichImageGrid
