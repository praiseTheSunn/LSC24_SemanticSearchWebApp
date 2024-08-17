import type React from 'react';
import { Box, Typography, IconButton, Paper } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface FilterTagProps {
  index: number;
  filter: {
    category: string;
    value: string | string[];
    status: number;
  };
  onIconClick: (index: number, category: string, value: any) => void;
}

const FilterTag: React.FC<FilterTagProps> = ({ index, filter, onIconClick }) => {
  const filterValue = Array.isArray(filter.value) ? filter.value.join(', ') : filter.value;

  return (
    <Box
      key={index}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        borderRadius: 1,
      }}
    >
      <Typography
        variant="caption"
        color="textSecondary"
        sx={{ mb: 0.5 }}
      >
        {filter.category}
      </Typography>
      <Paper
        square={false}
        elevation={0}
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: filter.status === 1 ? 'rgb(170, 247, 155)' : 'rgb(253, 174, 174)',
          width: '100%',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            flexGrow: 1,
            wordBreak: 'break-all',
            marginLeft: 1,
            marginRight: 1,
            
          }}
        >
          {filterValue}
        </Typography>
        <IconButton
          size="small"
          onClick={() => onIconClick(index, filter.category, filterValue)}
          title={filter.status === 1 ? 'Disable' : 'Enable'}
          sx={{
            color: filter.status === 1 ? 'rgb(29, 162, 3)' : 'rgb(211, 0, 0)',
          }}
        >
          {filter.status === 1 ? <CheckCircleIcon /> :  <CancelIcon />}
        </IconButton>
      </Paper>
    </Box>
  );
};

export default FilterTag;
