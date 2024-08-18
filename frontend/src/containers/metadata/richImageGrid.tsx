import type React from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeGrid as Grid } from 'react-window'
import { AnImage } from '../../components'
import type { ImageRecord } from '../../types/image'
// import './richSimilarity.css'
import { useAppSelector } from '../../AppState'

const RichImageGrid = () => {
  const columnCount = 3 // Number of columns in the grid

  const simData: ImageRecord[] = useAppSelector((state) => state.app.data);

  const Cell = ({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
    const index = rowIndex * columnCount + columnIndex
    if (index >= simData.length) return null // Ensure not to exceed simData length

    const data = simData[index]

  //   return (
  //     <div
  //       style={style}
  //       className="grid grid-cols-3 grid-rows-1 gap-1 pr-3 p-1"
  //     >
  //       {/* <div className="h-auto image-item overflow-hidden"> */}
  //       <div className="w-full h-full col-span-2  ">
  //         <AnImage key={index} data={data} index={index} />
  //       </div>
  //       <div className="w-full h-full col-span-1">
  //         <p>{data.ocr}</p>
  //         <p>{data.location_displayed}</p>
  //         <p>{data.caption}</p> {/* noun chunk */}
  //         {/* <p>{data.category}</p> */}
  //         {/* <p>{data.semantic_location}</p> */}
  //         {/* Add more information as needed */}
  //       </div>
  //     </div>
  //   )
  // }

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(1, minmax(0, 1fr))',
          gap: '0.25rem',
          paddingRight: '0.75rem',
          padding: '0.25rem',
          ...style, // existing styles
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            gridColumn: 'span 2 / span 2',
          }}
        >
          <AnImage key={index} data={data} index={index} />
        </div>
        <div
          style={{
            width: '100%',
            height: '100%',
            gridColumn: 'span 1 / span 1',
          }}
        >
          <p>{data.ocr}</p>
          <p>{data.location_displayed}</p>
          <p>{data.caption}</p>
        </div>
      </div>
    );
  }

  return (
    <div           style={{
      width: '100%',
      height: '100%',
    }}>
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
