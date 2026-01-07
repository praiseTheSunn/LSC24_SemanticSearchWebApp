import { Margin } from '@mui/icons-material'
import { Box } from '@mui/material'
import { pad } from 'lodash'
import { useState } from 'react'
import { List } from 'react-virtualized'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeGrid as Grid } from 'react-window'
import { TrapoziedBgGray2, TrapoziedBgGrayLeft } from '../../assets'
import bodyPartToIndex from '../../data/JointMapping'
import { LHEImages } from '../../data/LHEImages'
import { MVKImages } from '../../data/MVKImages'

const LevelList = [
  { level: 'MVK Dictionary', bg: TrapoziedBgGrayLeft },
  { level: 'LHE Dictionary', bg: TrapoziedBgGray2 },
]
interface ImageDictionary {
  name: string
  source: string
}

const DictionaryPopup = () => {
  const columnCount = 5
  const cellHeight = 150

  const [isMVKImages, setIsMVKImages] = useState(0)

  const Cell = ({
    columnIndex,
    rowIndex,
    style,
    images,
  }: {
    columnIndex: number
    rowIndex: number
    style: React.CSSProperties
    images: ImageDictionary[]
  }) => {
    const index = rowIndex * columnCount + columnIndex
    if (index >= images.length) return null

    const data = images[index]
    return (
      <Box
        sx={{
          ...style,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'white',
          borderRadius: '6px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            overflow: 'hidden',
            borderRadius: '6px',
            boxShadow: '2px 4px 4px rgba(0, 0, 0, 0.5)',
            margin: '5px',
            backgroundColor: 'lightgray',
            border: '1px solid black',
          }}
        >
          <img src={data.source} alt={data.name} style={{ width: '80%' }} />
        </Box>
        <Box
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '20%',
            fontSize: '18px',
            fontWeight: 'bold',
          }}
        >
          {data.name}
        </Box>
      </Box>
    )
  }

  const handleTabClick = (index: number) => {
    if (index === 0) {
      setIsMVKImages(0)
    } else {
      setIsMVKImages(1)
    }
  }

  return (
    <Box
      sx={{
        zIndex: '99999',
        position: 'fixed',
        width: '80%',
        height: '90%',
        top: '5%',
        left: '10%',
        backgroundColor: 'rgb(255, 255, 255)',
        display: 'inline-block',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        borderRadius: '6px',
        boxShadow: '2px 4px 4px rgba(0, 0, 0, 0.5)',
        border: '1px solid black',
      }}
    >
      <Box
        sx={{
          position: 'flex',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: '0' }}>Dictionary</h1>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          position: 'fixed',
          marginBottom: '-1.5px',
          // paddingTop: '15px',
          paddingLeft: '15px',
          width: '78%',
          height: '78%',
          flexDirection: 'column',
          // backgroundColor: 'lightgray',
        }}
      >
        <Box>
          {LevelList.map((item, index) => (
            <button
              key={item.level}
              type="button"
              className={`font-base grid-tab text-gray ${index === isMVKImages ? 'active' : ''}`}
              style={{
                paddingTop: '0.375rem',
                paddingBottom: '0.375rem',
                width: '197px',
                backgroundImage: `url(${item.bg})`,
                zIndex: 90 - index * 10,
                border: 'none',
                backgroundColor: 'transparent',
                marginLeft: `${index !== 0 && '-20px'}`,
                position: 'relative',
                height: '30px',
              }}
              onClick={() => handleTabClick(index)}
            >
              {item.level}
            </button>
          ))}
        </Box>
        {isMVKImages === 0 && (
          <AutoSizer>
            {({ height, width }) => {
              const columnWidth = width / columnCount - 1.5
              const rowHeight = cellHeight + 10
              const rowCount = Math.ceil(MVKImages.length / columnCount)

              return (
                <Grid
                  columnCount={columnCount}
                  columnWidth={columnWidth}
                  height={height}
                  rowCount={rowCount}
                  rowHeight={rowHeight}
                  width={width}
                  overscanRowCount={7}
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                  }}
                >
                  {({ columnIndex, rowIndex, style }) => (
                    <Cell
                      columnIndex={columnIndex}
                      rowIndex={rowIndex}
                      style={style}
                      images={MVKImages}
                    />
                  )}
                </Grid>
              )
            }}
          </AutoSizer>
        )}
        {isMVKImages !== 0 && (
          <AutoSizer>
            {({ height, width }) => {
              const columnWidth = width / columnCount - 1.5
              const rowHeight = cellHeight + 10
              const rowCount = Math.ceil(LHEImages.length / columnCount)

              return (
                <Grid
                  columnCount={columnCount}
                  columnWidth={columnWidth}
                  height={height}
                  rowCount={rowCount}
                  rowHeight={rowHeight}
                  width={width}
                  overscanRowCount={7}
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                  }}
                >
                  {({ columnIndex, rowIndex, style }) => (
                    <Cell
                      columnIndex={columnIndex}
                      rowIndex={rowIndex}
                      style={style}
                      images={LHEImages}
                    />
                  )}
                </Grid>
              )
            }}
          </AutoSizer>
        )}
      </Box>
    </Box>
  )
}

export default DictionaryPopup
