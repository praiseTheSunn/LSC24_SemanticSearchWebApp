import { Box, Grid, Tooltip, Typography } from '@mui/material'
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useAppSelector } from '../AppState'
import { getOppositeColor } from '../utils/getOppositeColor'
import type { DrawnItem, GridDict, Icon } from './Popup/ObjectPositionPopup'

interface WhiteboardProps {
  selectedIcon: Icon | null
  onDraw: (item: DrawnItem) => void
  onClear: boolean
  setIsClear: Dispatch<SetStateAction<boolean>>
  dataGrid: GridDict[][]
  setDataGrid: Dispatch<SetStateAction<GridDict[][]>>
  brushSize: number
}

const BrushWhiteboard: React.FC<WhiteboardProps> = React.memo(
  ({
    selectedIcon,
    onDraw,
    onClear,
    setIsClear,
    dataGrid,
    setDataGrid,
    brushSize,
  }) => {
    const Config = useAppSelector((state) => state.app.config)
    const [isDrawing, setIsDrawing] = useState<boolean>(false)
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })

    useEffect(() => {
      const updateCursorPosition = (e: MouseEvent) => {
        if (selectedIcon) setCursorPosition({ x: e.clientX, y: e.clientY })
      }
      window.addEventListener('mousemove', updateCursorPosition)
      return () => {
        window.removeEventListener('mousemove', updateCursorPosition)
      }
    }, [selectedIcon])

    useEffect(() => {
      const handleMouseUp = () => setIsDrawing(false)
      document.addEventListener('mouseup', handleMouseUp)
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

    const handleCellClick = useCallback(
      (row: number, col: number) => {
        if (selectedIcon === null) return

        setDataGrid((prevDataGrid) => {
          const newDataGrid = [...prevDataGrid]
          const halfBrush = Math.floor(brushSize / 2)

          for (let i = -halfBrush; i <= halfBrush; i++) {
            for (let j = -halfBrush; j <= halfBrush; j++) {
              const newRow = row + i
              const newCol = col + j
              if (
                newRow >= 0 &&
                newRow < Config.WhiteboardGridRowCount &&
                newCol >= 0 &&
                newCol < Config.WhiteboardGridColumnCount
              ) {
                newDataGrid[newRow][newCol] = {
                  color: selectedIcon.color || '',
                  objectName:
                    selectedIcon.name === 'none' ? '' : selectedIcon.name,
                }
              }
            }
          }
          return newDataGrid
        })
      },
      [
        selectedIcon,
        brushSize,
        Config.WhiteboardGridRowCount,
        Config.WhiteboardGridColumnCount,
      ],
    )

    const handleMouseDown = useCallback(
      (row: number, col: number, event: React.MouseEvent) => {
        event.preventDefault()
        setIsDrawing(true)
        handleCellClick(row, col)
      },
      [handleCellClick],
    )

    const handleMouseOver = useCallback(
      (row: number, col: number) => {
        if (isDrawing) handleCellClick(row, col)
      },
      [isDrawing, handleCellClick],
    )

    const gridMemo = useMemo(() => {
      return dataGrid.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <Grid
            item
            xs={1}
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            key={`${rowIndex}-${colIndex}`}
            sx={{
              width:
                Config.WhiteboardCanvasWidth / Config.WhiteboardGridColumnCount,
              height:
                Config.WhiteboardCanvasHeight / Config.WhiteboardGridRowCount,
              backgroundColor: cell.color || 'white',
              border: '1px solid #ccc',
            }}
            onMouseDown={(event) => handleMouseDown(rowIndex, colIndex, event)}
            onMouseOver={() => handleMouseOver(rowIndex, colIndex)}
          >
            <Typography
              sx={{
                textAlign: 'center',
                fontSize: '50%',
                color: cell.color
                  ? getOppositeColor(cell.color)
                  : cell.objectName
                    ? 'black'
                    : 'white',
                fontWeight: 'bold',
              }}
            >
              {cell.objectName}
            </Typography>
          </Grid>
        )),
      )
    }, [
      dataGrid,
      handleMouseDown,
      handleMouseOver,
      Config.WhiteboardCanvasWidth,
      Config.WhiteboardCanvasHeight,
      Config.WhiteboardGridColumnCount,
      Config.WhiteboardGridRowCount,
    ])

    return (
      <Box
        sx={{
          cursor: selectedIcon ? 'crosshair' : 'default',
          border: '1px solid black',
        }}
      >
        <Grid
          container
          spacing={0}
          columns={Config.WhiteboardGridColumnCount}
          sx={{
            width: Config.WhiteboardCanvasWidth,
            height: Config.WhiteboardCanvasHeight,
          }}
        >
          {gridMemo}
        </Grid>
        {selectedIcon && (
          <Box
            sx={{
              left: cursorPosition.x + 2,
              top: cursorPosition.y + 2,
              position: 'fixed',
              zIndex: 999999,
              pointerEvents: 'none',
            }}
          >
            <Tooltip title={selectedIcon.name}>
              {selectedIcon.source !== 'none' ? (
                <Box
                  component="img"
                  src={selectedIcon.source}
                  alt={selectedIcon.name}
                  sx={{
                    width: '32px',
                    height: '32px',
                    opacity: 0.8,
                    backgroundColor: selectedIcon.color || 'transparent',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: selectedIcon.color || 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selectedIcon.name}
                </Box>
              )}
            </Tooltip>
          </Box>
        )}
      </Box>
    )
  },
)

export default BrushWhiteboard
