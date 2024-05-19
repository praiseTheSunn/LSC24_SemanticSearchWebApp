import React, { useRef, useState, useEffect } from 'react';

const Whiteboard = ({ selectedIcon, onDraw, onClear, setIsClear }) => {
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [rect, setRect] = useState(null);
  const [drawnItems, setDrawnItems] = useState([]);
  const whiteboardRef = useRef(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateCursorPosition = (e) => {
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
  }, [onClear]);

  const handleMouseDown = (e) => {
    if (selectedIcon) {
      const rect = whiteboardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setStartPos({ x, y });
      setDrawing(true);
    }
  };

  const handleMouseMove = (e) => {
    if (drawing && startPos) {
      const rect = whiteboardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setRect({
        x: Math.min(x, startPos.x),
        y: Math.min(y, startPos.y),
        width: Math.abs(x - startPos.x),
        height: Math.abs(y - startPos.y),
      });
    }
  };

  const handleMouseUp = () => {
    if (drawing && rect) {
      const newItem = { rect, icon: selectedIcon };
      setDrawnItems([...drawnItems, newItem]);
      onDraw(newItem); // Pass the drawn item to the parent component
      setDrawing(false);
      setStartPos(null);
      setRect(null);
    }
  };

  return (
    <div
      ref={whiteboardRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        width: '280px',
        height: '200px',
        border: '1px solid black',
        position: 'relative',
        cursor: selectedIcon ? 'crosshair' : 'default',
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {drawnItems.map((item, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: item.rect.x,
              top: item.rect.y,
              width: item.rect.width,
              height: item.rect.height,
              border: '1px solid blue',
            }}
          >
            <img
              src={item.icon.source}
              alt={item.icon.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        ))}
        {rect && (
          <div
            style={{
              position: 'absolute',
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              border: '1px solid blue',
            }}
          >
            {selectedIcon && (
              <img
                src={selectedIcon.source}
                alt={selectedIcon.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}
          </div>
        )}
        {selectedIcon && (
          <div
            style={{
              position: 'fixed',
              left: cursorPosition.x + 2,
              top: cursorPosition.y + 2,
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            <img
              src={selectedIcon.source}
              alt={selectedIcon.name}
              style={{
                width: 33,
                height: 33,
                opacity: 0.8,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Whiteboard;
