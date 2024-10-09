import React, { useState, useEffect } from 'react';
import { Box, Slider, Typography } from '@mui/material';

const Whiteboard: React.FC = () => {
  const gridSize = 20;

  // Initialize a 20x20 grid with all cells set to false (uncolored)
  const initialGrid = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(false));

  const [grid, setGrid] = useState<boolean[][]>(initialGrid);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [brushSize, setBrushSize] = useState<number>(1); // Default brush size is 1x1

  useEffect(() => {
    // Ensure that when the mouse is released, `isDrawing` is reset globally
    const handleMouseUp = () => setIsDrawing(false);
    document.addEventListener('mouseup', handleMouseUp);

    // Cleanup the event listener when component unmounts
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleCellClick = (row: number, col: number) => {
    const newGrid = [...grid];

    // Calculate the starting position for the brush to center it on the clicked cell
    const halfBrush = Math.floor(brushSize / 2);

    // Iterate over brush size and update cells accordingly
    for (let i = -halfBrush; i <= halfBrush; i++) {
      for (let j = -halfBrush; j <= halfBrush; j++) {
        const newRow = row + i;
        const newCol = col + j;
        if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
          newGrid[newRow][newCol] = true;
        }
      }
    }

    setGrid(newGrid);
  };

  const handleMouseDown = (row: number, col: number, event: React.MouseEvent) => {
    event.preventDefault(); // Prevent any default behavior (crossed circle, etc.)
    setIsDrawing(true);
    handleCellClick(row, col);
  };

  const handleMouseOver = (row: number, col: number) => {
    if (isDrawing) {
      handleCellClick(row, col);
    }
  };

  const handleBrushSizeChange = (event: Event, newValue: number | number[]) => {
    setBrushSize(newValue as number);
  };

  return (
    <Box>
      {/* Brush Size Slider */}
      <Typography gutterBottom>Brush Size: {brushSize}</Typography>
      <Slider
        value={brushSize}
        min={1}
        max={5} // You can adjust the max brush size here
        step={1}
        onChange={handleBrushSizeChange}
        valueLabelDisplay="auto"
      />

      {/* Whiteboard Grid */}
      <Box
        display="grid"
        gridTemplateColumns={`repeat(${gridSize}, 20px)`}
        gridTemplateRows={`repeat(${gridSize}, 20px)`}
        gap={0} // Reduce gap between cells to 0
        // onMouseLeave={() => setIsDrawing(false)} // Reset drawing when mouse leaves
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <Box
              key={`${rowIndex}-${colIndex}`}
              sx={{
                width: 20,
                height: 20,
                backgroundColor: cell ? 'black' : 'white',
                border: '1px solid #ccc',
              }}
              onMouseDown={(event) => handleMouseDown(rowIndex, colIndex, event)}
              onMouseOver={() => handleMouseOver(rowIndex, colIndex)}
            />
          ))
        )}
      </Box>
    </Box>
  );
};

export default Whiteboard;
