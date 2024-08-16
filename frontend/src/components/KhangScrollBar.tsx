import type React from 'react'
import { type Dispatch, type SetStateAction, useState } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';

interface KhangScrollBarProps {
  dates: string[];
  setSelectedDate: Dispatch<SetStateAction<string | null>>;
}

const KhangScrollBar = ({ dates, setSelectedDate } : KhangScrollBarProps) => {
  dates = ["2019-04-03"]
  const interval = dates.length / (dates.length > 10 ? (dates.length * 10) / 100 : dates.length);

  return (
    <Box
      sx={{ width: '7px', height: '98%', backgroundColor: 'lightGray', display: 'grid' }}
    >
      {dates.map((date, index) => (
        <Box
          key={date}
          className={`tooltip_${index}`}
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: '10px',
            position: 'relative',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'red',
            },
          }}
          onClick={() => setSelectedDate(date)}
        >
          {!(index % interval === 0 || index === dates.length - 1) && (
            <Tooltip title={date} placement="right">
              <Box
                sx={{
                  position: 'absolute',
                  top: '40%',
                  left: '10px',
                  width: '100px',
                }}
              >
                <Typography variant="body2">{date}</Typography>
              </Box>
            </Tooltip>
          )}
          {(index % interval === 0 || index === dates.length - 1) && (
            <Box
              sx={{
                position: 'absolute',
                top: '40%',
                left: '10px',
                width: '100px',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {date}
              </Typography>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default KhangScrollBar;
