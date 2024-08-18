import { Box } from '@mui/material';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react'
import { Tooltip } from 'react-tooltip'

interface KhangScrollBarProps {
  dates: string[];
  setSelectedDate: Dispatch<SetStateAction<string | null>>;
}

const KhangScrollBar = ({ dates, setSelectedDate } : KhangScrollBarProps) => {
  const interval = Math.round(
    dates.length /
      (dates.length > 10 ? 20 : dates.length)
  )
  console.log('interval', dates[dates.length - 1], dates.length, interval)

  return (
    <Box className="khang-scrollbar" sx={{ display: 'grid', backgroundColor: '#d7d7d7', width: '7px', height: '100%' }}>
      {dates.map((date, index) => (
        <Box
          key={date}
          className={`tooltip_${index}`}
          sx={{ width: '100%', height: '100%', borderRadius: '10px', position: 'relative', '&:hover': { backgroundColor: '#ff543e' }, cursor: 'pointer' }}
          onClick={() => setSelectedDate(date)}
        >
          {!(index % interval === 0 || index === dates.length - 1) && (
            <Tooltip anchorSelect={`.tooltip_${index}`} place="right">
              {date}
            </Tooltip>
          )}
          {
            <Box
              className="absolute top-[40%] w-[100px] hover:font-bold"
              sx={{ 
                left: '10px',
                position: 'absolute',
                top: '40%',
                width: '100px',
                '&:hover': {
                  fontWeight: 'bold'
                }
              }}
            >
              {index % interval === 0 || index === dates.length - 1
                ? date
                : ' '}
            </Box>
          }
        </Box>
      ))}
    </Box>
  )
}

export default KhangScrollBar