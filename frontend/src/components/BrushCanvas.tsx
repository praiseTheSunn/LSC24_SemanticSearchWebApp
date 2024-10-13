import { Box, IconButton, Slider, TextField, Typography } from '@mui/material'
import type React from 'react'
import { useEffect, useState } from 'react'

import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material'
import type { Dispatch, SetStateAction } from 'react'
import { useAppSelector } from '../AppState'
import type {
  DrawnItem,
  GridDict,
  Icon,
  Rect,
} from './Popup/ObjectPositionPopup'
// import { Grid } from 'react-virtualized'

import { Grid } from '@mui/material'

interface WhiteboardProps {
  selectedIcon: Icon | null
  onDraw: (item: DrawnItem) => void
  onClear: boolean
  setIsClear: Dispatch<SetStateAction<boolean>>
  setSelecObjects: Dispatch<SetStateAction<DrawnItem[]>>
  dataGrid: GridDict[][]
  setDataGrid: Dispatch<SetStateAction<GridDict[][]>>
}

const getOppositeColor = (HexaStr: string): string => {
  // Remove the hash symbol if present
  const hex = HexaStr.replace('#', '')

  // Convert hex string to an integer, invert the bits, and mask with 0xFFFFFF
  const invertedColor = (Number.parseInt(hex, 16) ^ 0xffffff)
    .toString(16)
    .padStart(6, '0')

  // Return the inverted color as a hex string with a hash symbol
  return `#${invertedColor}`
}

const BrushWhiteboard: React.FC<WhiteboardProps> = ({
  selectedIcon,
  onDraw,
  onClear,
  setIsClear,
  setSelecObjects,
  dataGrid,
  setDataGrid,
}) => {
  const gridSize = 20
  const Config = useAppSelector((state) => state.app.config)

  const initDataGrid = Array(gridSize)
    .fill(null)
    .map(() =>
      Array(gridSize).fill({
        color: '',
        objectName: '',
      }),
    )

  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [brushSize, setBrushSize] = useState<number>(1) // Default brush size is 1x1
  const [drawnItems, setDrawnItems] = useState<DrawnItem[]>([])

  useEffect(() => {
    // Ensure that when the mouse is released, `isDrawing` is reset globally
    const handleMouseUp = () => setIsDrawing(false)
    document.addEventListener('mouseup', handleMouseUp)

    // Cleanup the event listener when component unmounts
    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  useEffect(() => {
    if (onClear) {
      setIsClear(false)
      console.log('clear')
    }
  }, [onClear, setIsClear])

  useEffect(() => {
    setSelecObjects(drawnItems)
  }, [drawnItems, setSelecObjects])

  const handleCellClick = (row: number, col: number) => {
    if (selectedIcon === null) {
      return
    }
    console.log('NEW selectedIcon', selectedIcon)
    const newDataGrid = [...dataGrid]

    // Calculate the starting position for the brush to center it on the clicked cell
    const halfBrush = Math.floor(brushSize / 2)

    // Iterate over brush size and update cells accordingly
    for (let i = -halfBrush; i <= halfBrush; i++) {
      for (let j = -halfBrush; j <= halfBrush; j++) {
        const newRow = row + i
        const newCol = col + j
        if (
          newRow >= 0 &&
          newRow < gridSize &&
          newCol >= 0 &&
          newCol < gridSize
        ) {
          dataGrid[newRow][newCol] = {
            color: selectedIcon.color ? selectedIcon.color : '',
            objectName: selectedIcon.name === 'none' ? '' : selectedIcon.name,
          }
        }
      }
    }
    setDataGrid(newDataGrid)
  }

  const handleMouseDown = (
    row: number,
    col: number,
    event: React.MouseEvent,
  ) => {
    event.preventDefault() // Prevent any default behavior (crossed circle, etc.)
    setIsDrawing(true)
    handleCellClick(row, col)
  }

  const handleMouseOver = (row: number, col: number) => {
    if (isDrawing) {
      handleCellClick(row, col)
    }
  }

  const handleBrushSizeChange = (event: Event, newValue: number | number[]) => {
    setBrushSize(newValue as number)
  }

  return (
    <Box
      sx={{
        cursor: selectedIcon ? 'crosshair' : 'default',
        border: '1px solid black',
      }}
    >
      {/* <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: '10px',
          marginBottom: '10px',
          gap: '10px',
        }}
      >
        <Typography
          gutterBottom
          sx={{
            width: '25%',
          }}
        >
          Brush Size: {brushSize}
        </Typography>
        <Slider
          sx={
            {
              // marginRight: '10px',
            }
          }
          value={brushSize}
          min={1}
          max={7} // You can adjust the max brush size here
          step={2}
          onChange={handleBrushSizeChange}
          valueLabelDisplay="off"
        />
      </Box> */}

      {/* Whiteboard Grid */}
      <Grid
        container
        spacing={0} // Reduce gap between cells to 0
        // columns={gridSize}
        // rows={gridSize}
        // onMouseLeave={() => setIsDrawing(false)} // Reset drawing when mouse leaves
        columns={gridSize}
        sx={{
          width: Config.WhiteboardCanvasWidth,
          height: Config.WhiteboardCanvasHeight,
        }}
        // rows={gridSize}
      >
        {dataGrid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <Grid
              item
              xs={1}
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              key={`${rowIndex}-${colIndex}`}
              sx={{
                width: Config.WhiteboardCanvasWidth / gridSize,
                height: Config.WhiteboardCanvasHeight / gridSize,
                // minHeight: '20px',
                // minWidth: '20px',
                backgroundColor:
                  dataGrid[rowIndex][colIndex].color !== ''
                    ? dataGrid[rowIndex][colIndex].color
                    : 'white',
                border: '1px solid #ccc',
              }}
              onMouseDown={(event) =>
                handleMouseDown(rowIndex, colIndex, event)
              }
              onMouseOver={() => handleMouseOver(rowIndex, colIndex)}
            >
              <Typography
                sx={{
                  textAlign: 'center',
                  fontSize: '50%',
                  color:
                    dataGrid[rowIndex][colIndex].color !== ''
                      ? getOppositeColor(dataGrid[rowIndex][colIndex].color)
                      : dataGrid[rowIndex][colIndex].objectName !== ''
                        ? 'black'
                        : 'white',
                  fontWeight: 'bold',
                }}
              >
                {dataGrid[rowIndex][colIndex].objectName}{' '}
              </Typography>
            </Grid>
          )),
        )}
      </Grid>
    </Box>
  )
}

export default BrushWhiteboard
