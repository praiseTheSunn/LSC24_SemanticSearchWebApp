import type React from 'react'
import { useEffect, useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';

interface ScrollbarProps {
  dates: string[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

const Scrollbar: React.FC<ScrollbarProps> = ({ dates, selectedDate, setSelectedDate }) => {
  const [thumbTop, setThumbTop] = useState(0);
  const [date, setDate] = useState<string | null>(null);
  const [showPercentage, setShowPercentage] = useState(false);
  const [percentageTop, setPercentageTop] = useState(0);
  const [scrollInterval, setScrollInterval] = useState(0);
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const numOfDates = dates.length;
    setScrollInterval(Math.min(numOfDates, 10));
  }, [dates]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (thumbRef.current === null) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const maxTop = e.currentTarget.clientHeight - thumbRef.current?.clientHeight;
    const newTop = Math.min(Math.max(y - thumbRef.current?.clientHeight / 2, 0), maxTop);
    updateContentPosition(newTop, maxTop);
  };

  const handleMouseLeave = () => {
    setShowPercentage(false);
  };

  const handleScrollbarClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (thumbRef.current === null) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const maxTop = e.currentTarget.clientHeight - thumbRef.current?.clientHeight;
    const newTop = Math.min(Math.max(y - thumbRef.current?.clientHeight / 2, 0), maxTop);
    const index = Math.ceil((newTop / maxTop) * (dates.length - 1));
    setSelectedDate(dates[index]);
  };

  const updateContentPosition = (newTop: number, maxTop: number) => {
    const index = Math.ceil((newTop / maxTop) * (dates.length - 1));
    setDate(dates[index]);
    setShowPercentage(true);
    setPercentageTop(newTop - 20);
  };

  return (
    <Box
      sx={{
        width: 8,
        height: 565,
        backgroundColor: 'gray',
        cursor: 'pointer',
        borderRadius: 4,
        position: 'relative',
      }}
      id="scrollbar"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleScrollbarClick}
    >
      <Box
        ref={thumbRef}
        sx={{
          width: '100%',
          height: 50,
          backgroundColor: 'black',
          left: 0,
          borderRadius: 4,
          transition: 'top 0.1s ease-in-out',
          position: 'absolute',
          top: `${thumbTop}px`,
        }}
        id="thumb"
      />
      {showPercentage && (
        <Box
          sx={{
            left: 20,
            minWidth: 120,
            padding: 2,
            fontFamily: 'Arial, Helvetica, sans-serif',
            textAlign: 'center',
            backgroundColor: '#73bdeb',
            borderRadius: 4,
            position: 'absolute',
            top: `${percentageTop}px`,
          }}
          id="scrollPercentage"
        >
          {date}
        </Box>
      )}
      {dates.map((date, index) => (
        <Box
          key={date}
          sx={{
            width: '100px',
            position: 'absolute',
            top: `${percentageTop}px`,
          }}
        >
          {date}
        </Box>
      ))}
    </Box>
  );
};

export default Scrollbar;
