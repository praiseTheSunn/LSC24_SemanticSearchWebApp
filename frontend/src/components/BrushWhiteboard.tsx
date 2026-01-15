import { Box, Grid, Tooltip, Typography } from '@mui/material'
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { appActions, useAppDispatch, useAppSelector } from '../AppState'
import { calculateLineCoordinates } from '../utils/bresenhamLine'
import { getOppositeColor } from '../utils/getOppositeColor'
import type { DrawnItem, GridDict, Icon } from './Popup/ObjectPositionPopup'

interface WhiteboardProps {
  selectedIcon: Icon | null
  onDraw: (item: DrawnItem | null) => void
  onClear: boolean
  setIsClear: Dispatch<SetStateAction<boolean>>
  dataGrid: GridDict[][]
  setDataGrid: Dispatch<SetStateAction<GridDict[][]>>
  brushSize: number
  setSelectedIcon: Dispatch<SetStateAction<Icon | null>>
  isAutoFill: boolean
  isAutoComplete: boolean
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
    setSelectedIcon,
    isAutoFill,
    isAutoComplete,
  }) => {
    const Config = useAppSelector((state) => state.app.config)
    const [isDrawing, setIsDrawing] = useState<boolean>(false)
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
    const [contour, setContour] = useState<
      { x: number; y: number; checked: boolean }[]
    >([])

    const dispatch = useAppDispatch()
    
    useEffect(() => {
      const updateCursorPosition = (e: MouseEvent) => {
        if (selectedIcon) setCursorPosition({ x: e.clientX, y: e.clientY })
      }
      window.addEventListener('mousemove', updateCursorPosition)
      return () => {
        window.removeEventListener('mousemove', updateCursorPosition)
      }
    }, [selectedIcon])
    const handleMouseUp = async (row: number, col: number) => {
      if (isAutoComplete) {
        if (!contour || contour.length === 0) return
        const autoFillCoors = calculateLineCoordinates(
          contour[0]?.x,
          contour[0]?.y,
          row,
          col,
        )
        const newDataGrid = [...dataGrid]
        for (const coor of autoFillCoors) {
          newDataGrid[coor.x0][coor.y0] = {
            color: selectedIcon?.color || '',
            objectName:
              !selectedIcon || selectedIcon?.name === 'none'
                ? ''
                : selectedIcon.name,
          }
        }
        setDataGrid(newDataGrid)
      }
      if (isAutoFill) {
        let foundStartPoint = false
        const newDataGrid = [...dataGrid]
        let selectedPair = []
        dispatch(appActions.setLoadingPopUp('Auto Filling...'))
        // biome-ignore lint/correctness/noConstantCondition: <explanation>
        while (1) {
          selectedPair = []
          const uncheckedContour = contour.filter(
            (element) => element.checked === false,
          )
          if (uncheckedContour.length <= 0) break
          const randomIndex = Math.floor(
            Math.random() * uncheckedContour.length,
          )
          const randomOnBorderPoint = uncheckedContour[randomIndex]
          let crossBorderCount = 0
          for (
            let k = Math.max(randomOnBorderPoint.y, 1);
            k < Config.WhiteboardGridColumnCount - 1;
            k++
          ) {
            if (
              (newDataGrid[randomOnBorderPoint.x][k].color !==
                newDataGrid[randomOnBorderPoint.x][k - 1].color ||
                newDataGrid[randomOnBorderPoint.x][k].objectName !==
                  newDataGrid[randomOnBorderPoint.x][k - 1].objectName) &&
              newDataGrid[randomOnBorderPoint.x][k].color ===
                (selectedIcon?.color || '') &&
              newDataGrid[randomOnBorderPoint.x][k].objectName ===
                (!selectedIcon || selectedIcon?.name === 'none'
                  ? ''
                  : selectedIcon.name)
            ) {
              crossBorderCount = crossBorderCount + 1
              selectedPair.push({
                x: randomOnBorderPoint.x,
                y: k,
                checked: true,
              })
            }
          }
          contour[contour.indexOf(randomOnBorderPoint)].checked = true
          if (crossBorderCount === 2) {
            foundStartPoint = true
            break
          }
        }

        if (foundStartPoint === false) {
          dispatch(appActions.setLoadingPopUp(''))
          setIsDrawing(false)
          onDraw(null)
          return
        }
        const centroidCoor = {
          x: Math.floor((selectedPair[0].x + selectedPair[1].x) / 2),
          y: Math.floor((selectedPair[0].y + selectedPair[1].y) / 2),
        }

        const stack = []
        stack.push(centroidCoor)
        // biome-ignore lint/correctness/noConstantCondition: <explanation>
        while (1) {
          if (stack.length <= 0) break
          const curCoor: { x: number; y: number } | undefined = stack.pop()
          if (!curCoor) continue
          if (
            newDataGrid[curCoor.x][curCoor.y].color ===
              (selectedIcon?.color || '') &&
            newDataGrid[curCoor.x][curCoor.y].objectName ===
              (!selectedIcon || selectedIcon?.name === 'none'
                ? ''
                : selectedIcon.name)
          )
            continue
          newDataGrid[curCoor.x][curCoor.y] = {
            color: selectedIcon?.color || '',
            objectName:
              !selectedIcon || selectedIcon?.name === 'none'
                ? ''
                : selectedIcon.name,
          }
          for (let i = -1; i <= 1; i++) {
            if (i === 0) continue
            const newX: number = curCoor.x + i
            if (
              newX >= 0 &&
              newX < Config.WhiteboardGridRowCount &&
              (newDataGrid[newX][curCoor.y].color !==
                (selectedIcon?.color || '') ||
                newDataGrid[newX][curCoor.y].objectName !==
                  (!selectedIcon || selectedIcon?.name === 'none'
                    ? ''
                    : selectedIcon.name))
            ) {
              stack.push({ x: newX, y: curCoor.y })
            }
          }
          for (let j = -1; j <= 1; j++) {
            if (j === 0) continue
            const newY: number = curCoor.y + j
            if (
              newY >= 0 &&
              newY < Config.WhiteboardGridColumnCount &&
              (newDataGrid[curCoor.x][newY].color !==
                (selectedIcon?.color || '') ||
                newDataGrid[curCoor.x][newY].objectName !==
                  (!selectedIcon || selectedIcon?.name === 'none'
                    ? ''
                    : selectedIcon.name))
            ) {
              stack.push({ x: curCoor.x, y: newY })
            }
          }
        }
        setDataGrid(newDataGrid)
      }
      dispatch(appActions.setLoadingPopUp(''))
      setIsDrawing(false)
      onDraw(null)
    }

    useEffect(() => {
      if (onClear) {
        setIsClear(false)
        console.log('clear')
      }
    }, [onClear, setIsClear])

    const handleCellClick = useCallback(
      async (row: number, col: number) => {
        if (selectedIcon === null) return
        setContour((prevContour) => [
          ...prevContour,
          { x: row, y: col, checked: false },
        ])
        const newDataGrid = [...dataGrid]
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
                color: selectedIcon?.color || '',
                objectName:
                  !selectedIcon || selectedIcon?.name === 'none'
                    ? ''
                    : selectedIcon.name,
              }
            }
          }
        }

        setDataGrid(newDataGrid)
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
        setContour([{ x: row, y: col, checked: false }])
      },
      [handleCellClick],
    )

    const handleMouseOver = useCallback(
      async (row: number, col: number) => {
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
            onMouseOver={async () => handleMouseOver(rowIndex, colIndex)}
            onMouseUp={() => handleMouseUp(rowIndex, colIndex)}
          >
            <Typography
              sx={{
                textAlign: 'center',
                fontSize: '50%',
                color: cell.color
                  ? getOppositeColor(cell.color)
                  : (cell.objectName
                    ? 'black'
                    : 'white'),
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
