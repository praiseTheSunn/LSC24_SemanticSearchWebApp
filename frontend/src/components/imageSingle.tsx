import React from 'react';
import { Box, Paper } from '@mui/material';
import AnImage from './AnImage';
import type { ImageRecord } from '../types/image';

interface ImageSingleProps {
  image: ImageRecord;
}

const ImageSingle = ({ image }: ImageSingleProps) => {
  return (
    <Paper
      elevation={4}
      sx={{
        p: 0.5,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'white',
        my: 1,
        maxHeight: '230px',
      }}
    >
      <Box
        sx={{
          mb: '2px',
          width: '100%',
          height: '120px',
          objectFit: 'contain',
          minWidth: '160px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AnImage data={image} />
      </Box>
    </Paper>
  );
};

export default ImageSingle;