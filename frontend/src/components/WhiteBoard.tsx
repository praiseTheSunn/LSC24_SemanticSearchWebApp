import type React from "react"
import { type SetStateAction, useEffect, useRef, useState } from "react"
import { Box, IconButton, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { DrawnItem, Icon, Rect } from "./Popup/ObjectPositionPopup";


interface WhiteboardProps {
  selectedIcon: Icon | null;
  onDraw: (item: DrawnItem) => void;
  onClear: boolean;
  setIsClear: React.Dispatch<SetStateAction<boolean>>;
  setSelecObjects: React.Dispatch<SetStateAction<DrawnItem[]>>;
}

const Whiteboard: React.FC<WhiteboardProps> = ({
  selectedIcon,
  onDraw,
  onClear,
  setIsClear,
  setSelecObjects,
}) => {
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [drawnItems, setDrawnItems] = useState<DrawnItem[]>([]);
  const whiteboardRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateCursorPosition = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', updateCursorPosition);
    return () => {
      window.removeEventListener('mousemove', updateCursorPosition);
    };
  }, []);

  useEffect(() => {
    if (onClear) {
      setDrawnItems([]);
      setIsClear(false);
    }
  }, [onClear, setIsClear]);

  useEffect(() => {
    setSelecObjects(drawnItems);
  }, [drawnItems, setSelecObjects]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (selectedIcon && whiteboardRef.current) {
      const rect = whiteboardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setStartPos({ x, y });
      setDrawing(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (drawing && startPos && whiteboardRef.current) {
      const rect = whiteboardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const whiteboardWidth = whiteboardRef.current.offsetWidth;
      const whiteboardHeight = whiteboardRef.current.offsetHeight;
      const x_percent = (e.clientX - rect.left) / whiteboardWidth;
      const y_percent = (e.clientY - rect.top) / whiteboardHeight;
      const startX = startPos.x / whiteboardWidth;
      const startY = startPos.y / whiteboardHeight;

      setRect({
        x: Math.min(x, startPos.x),
        y: Math.min(y, startPos.y),
        width: Math.abs(x - startPos.x),
        height: Math.abs(y - startPos.y),
        top: Math.min(y_percent, startY),
        left: Math.min(x_percent, startX),
        bottom: Math.max(y_percent, startY),
        right: Math.max(x_percent, startX),
      });
    }
  };

  const handleMouseUp = () => {
    if (drawing && rect && selectedIcon) {
      const newItem = { rect, icon: selectedIcon };
      setDrawnItems([...drawnItems, newItem]);
      onDraw(newItem); // Pass the drawn item to the parent component
      setDrawing(false);
      setStartPos(null);
      setRect(null);
    }
  };

  const StyledBox = styled(Box)(({ theme }) => ({
    border: '1px solid black',
    position: 'relative',
    cursor: selectedIcon ? 'crosshair' : 'default',
    width: '280px',
    height: '200px',
  }));

  return (
    <StyledBox
      ref={whiteboardRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Box className="relative w-full h-full">
        {drawnItems.map((item, index) => (
          <Box
            key={item.icon.name}
            className="absolute border border-blue"
            sx={{
              left: item.rect.x,
              top: item.rect.y,
              width: item.rect.width,
              height: item.rect.height,
            }}
          >
            <img
              src={item.icon.source}
              alt={item.icon.name}
              className="w-full h-full object-cover"
            />
          </Box>
        ))}
        {rect && (
          <Box
            className="absolute border border-blue"
            sx={{
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
            }}
          >
            {selectedIcon && (
              <img
                src={selectedIcon.source}
                alt={selectedIcon.name}
                className="w-full h-full object-cover"
              />
            )}
          </Box>
        )}
        {selectedIcon && (
          <Box
            className="fixed z-50 pointer-events-none"
            sx={{
              left: cursorPosition.x + 2,
              top: cursorPosition.y + 2,
            }}
          >
            <Tooltip title={selectedIcon.name}>
              <img
                src={selectedIcon.source}
                alt={selectedIcon.name}
                className="w-8 h-8 opacity-80"
              />
            </Tooltip>
          </Box>
        )}
      </Box>
    </StyledBox>
  );
};

export default Whiteboard;
