import React from 'react';
import { Box, Typography } from '@mui/material';

type ImageClusterProps = {
  bigImage: string,
  smallImage1: string,
  smallImage2: string,
  location_name: string,
};

const ImageCluster = ({
  bigImage,
  smallImage1,
  smallImage2,
  location_name,
} : ImageClusterProps) => {
  return (
    <Box
      className="image-cluster-container"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box
        className="big-image-container"
        sx={{
          width: '100%',
          maxWidth: '400px',
          marginBottom: 2,
        }}
      >
        <Box
          component="img"
          src={bigImage}
          alt="big-image"
          sx={{
            width: '100%',
            height: 'auto',
            borderRadius: '8px',
          }}
        />
      </Box>
      <Box
        className="small-image-container"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: 1,
        }}
      >
        <Box
          component="img"
          src={smallImage1}
          alt="small-image-1"
          sx={{
            width: '100px',
            height: '100px',
            borderRadius: '8px',
          }}
        />
        <Box
          component="img"
          src={smallImage2}
          alt="small-image-2"
          sx={{
            width: '100px',
            height: '100px',
            borderRadius: '8px',
          }}
        />
      </Box>
      <Typography
        className="location-name"
        variant="caption"
        sx={{
          marginTop: 2,
          textAlign: 'center',
          color: 'text.primary',
        }}
      >
        {location_name}
      </Typography>
    </Box>
  );
};

export default ImageCluster;
