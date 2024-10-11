import { Box, Tooltip, Typography } from '@mui/material'
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useAppSelector } from '../AppState'
import type { DrawnItem, Icon, Rect } from './Popup/ObjectPositionPopup'

interface WhiteboardProps {
  selectedIcon: Icon | null
  onDraw: (item: DrawnItem) => void
  onClear: boolean
  setIsClear: Dispatch<SetStateAction<boolean>>
  setSelecObjects: Dispatch<SetStateAction<DrawnItem[]>>
}

const calculateOverlappedCells = (
  drawnItem: DrawnItem,
  cellHeight: number,
  cellWidth: number,
): { encodeObjectStrings: string[]; encodeColorStrings: string[] } => {
  const topRow = Math.floor(drawnItem.rect.top / cellHeight)
  const bottomRow = Math.floor(drawnItem.rect.bottom / cellHeight)
  const leftCol = Math.floor(drawnItem.rect.left / cellWidth)
  const rightCol = Math.floor(drawnItem.rect.right / cellWidth)

  const encodeObjectStrings: string[] = []
  const encodeColorStrings: string[] = []

  for (let row = topRow; row <= bottomRow; row++) {
    for (let col = leftCol; col <= rightCol; col++) {
      if (drawnItem.icon.name !== 'none') {
        const encode = `${row}${String.fromCharCode(97 + col)}${drawnItem.icon.name.replace(' ', '_')}`
        encodeObjectStrings.push(encode)
      }
      if (drawnItem.icon.color && drawnItem.icon.color !== 'none') {
        const encode = `${row}${String.fromCharCode(97 + col)}${drawnItem.icon.color.split('#')[1]}`
        encodeColorStrings.push(encode)
      }
    }
  }

  return { encodeObjectStrings, encodeColorStrings }
}

const Whiteboard: React.FC<WhiteboardProps> = ({
  selectedIcon,
  onDraw,
  onClear,
  setIsClear,
  setSelecObjects,
}) => {
  const [drawing, setDrawing] = useState(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
    null,
  )
  const [rect, setRect] = useState<Rect | null>(null)
  const [drawnItems, setDrawnItems] = useState<DrawnItem[]>([])
  const whiteboardRef = useRef<HTMLDivElement>(null)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })

  const Config = useAppSelector((state) => state.app.config)

  //BAD PERFORMANCE HERE
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
    if (onClear) {
      setDrawnItems([])
      setIsClear(false)
    }
  }, [onClear, setIsClear])

  useEffect(() => {
    setSelecObjects(drawnItems)
  }, [drawnItems, setSelecObjects])

  // console.log('windowRef:', whiteboardRef);
  const cellWidth = useMemo(() => {
    return whiteboardRef.current
      ? whiteboardRef.current.offsetWidth /
          Config.WhiteboardGridColumnCount /
          whiteboardRef.current.clientWidth
      : 1000000001
  }, [whiteboardRef.current])

  const cellHeight = useMemo(() => {
    return whiteboardRef.current
      ? whiteboardRef.current.offsetHeight /
          Config.WhiteboardGridRowCount /
          whiteboardRef.current.clientHeight
      : 1000000001
  }, [whiteboardRef.current])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (selectedIcon && whiteboardRef.current) {
        const rect = whiteboardRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setStartPos({ x, y })
        setDrawing(true)
      }
    },
    [selectedIcon],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (drawing && startPos && whiteboardRef.current) {
        const rect = whiteboardRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const whiteboardWidth = whiteboardRef.current.offsetWidth
        const whiteboardHeight = whiteboardRef.current.offsetHeight
        const x_percent = (e.clientX - rect.left) / whiteboardWidth
        const y_percent = (e.clientY - rect.top) / whiteboardHeight
        const startX = startPos.x / whiteboardWidth
        const startY = startPos.y / whiteboardHeight

        setRect({
          x: Math.min(x, startPos.x),
          y: Math.min(y, startPos.y),
          width: Math.abs(x - startPos.x),
          height: Math.abs(y - startPos.y),
          top: Math.min(y_percent, startY),
          left: Math.min(x_percent, startX),
          bottom: Math.max(y_percent, startY),
          right: Math.max(x_percent, startX),
        })
      }
    },
    [drawing, startPos],
  )

  const handleMouseUp = useCallback(() => {
    if (drawing && rect && selectedIcon) {
      const newItem: DrawnItem = {
        rect,
        icon: selectedIcon,
        encodeObjects: '',
        encodeColors: '',
      }
      const encodeStrings = calculateOverlappedCells(
        newItem,
        cellHeight,
        cellWidth,
      )
      newItem.encodeColors = encodeStrings.encodeColorStrings.join(' ')
      newItem.encodeObjects = encodeStrings.encodeObjectStrings.join(' ')
      // console.log('New item:', newItem)

      setDrawnItems((prevItems) => [...prevItems, newItem])
      onDraw(newItem) // Pass the drawn item to the parent component
      setDrawing(false)
      setStartPos(null)
      setRect(null)
    }
  }, [drawing, rect, selectedIcon, onDraw])

  const drawnItemsMemo = useMemo(
    () =>
      drawnItems.map((item, index) => (
        <Box
          title={item.icon.name}
          key={`${item.icon.name}-${index}`}
          sx={{
            left: item.rect.x,
            top: item.rect.y,
            width: item.rect.width,
            height: item.rect.height,
            position: 'absolute',
            border: '1px solid blue',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: item.icon.color ? item.icon.color : 'transparent',
          }}
        >
          {item.icon.source !== 'none' ? (
            <img
              src={item.icon.source}
              alt={item.icon.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Typography variant="caption">{item.icon.name}</Typography>
          )}
        </Box>
      )),
    [drawnItems],
  )

  return (
    <Box
      sx={{
        border: '1px solid black',
        position: 'relative',
        cursor: selectedIcon ? 'crosshair' : 'default',
        width: '280px',
        height: '200px',
      }}
      component="div"
      ref={whiteboardRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      id="whiteboard"
      onMouseUp={handleMouseUp}
    >
      {Array.from({ length: Config.WhiteboardGridColumnCount }).map(
        (_, index) => (
          <Box
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            key={index}
            sx={{
              position: 'absolute',
              left: `${(index * 100) / Config.WhiteboardGridColumnCount}%`,
              top: 0,
              width: '1px',
              height: '100%',
              backgroundColor: 'black',
              opacity: 0.1,
            }}
          />
        ),
      )}
      {Array.from({ length: Config.WhiteboardGridRowCount }).map((_, index) => (
        <Box
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          key={index}
          sx={{
            position: 'absolute',
            left: 0,
            top: `${(index * 100) / Config.WhiteboardGridRowCount}%`,
            width: '100%',
            height: '1px',
            backgroundColor: 'black',
            opacity: 0.1,
          }}
        />
      ))}
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        {drawnItemsMemo}
        {rect && (
          <Box
            sx={{
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              position: 'absolute',
              border: '1px solid blue',
            }}
          >
            {selectedIcon &&
              (selectedIcon.source !== 'none' ? (
                <Box
                  component="img"
                  src={selectedIcon.source}
                  alt={selectedIcon.name}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    backgroundColor: selectedIcon.color
                      ? selectedIcon.color
                      : 'transparent',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: selectedIcon.color
                      ? selectedIcon.color
                      : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selectedIcon.name}
                </Box>
              ))}
          </Box>
        )}
        {selectedIcon && (
          <Box
            sx={{
              left: cursorPosition.x + 2,
              top: cursorPosition.y + 2,
              position: 'fixed',
              zIndex: 50,
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
                    backgroundColor: selectedIcon.color
                      ? selectedIcon.color
                      : 'transparent',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: selectedIcon.color
                      ? selectedIcon.color
                      : 'transparent',
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
    </Box>
  )
}

export default React.memo(Whiteboard)
