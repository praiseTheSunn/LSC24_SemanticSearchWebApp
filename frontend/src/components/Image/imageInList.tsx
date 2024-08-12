import type React from 'react';
import viewIcon from '../../assets/view_icon.png';
import { Box, Typography } from '@mui/material';

interface ImageRecord {
  is_origin?: number;
  status: number;
  path: string;
  date: string;
  time: string;
  image: string;
}

interface ImageInListProps {
  record: ImageRecord;
  index: number;
  handleImageClick: (path: string, image: string) => void;
  openSingleImage: (image: string, path: string, date: string, time: string) => void;
}

const ImageInList: React.FC<ImageInListProps> = ({ record, index, handleImageClick, openSingleImage }) => {
  const hasOrigin = record.is_origin !== undefined ? 1 : 0;

  return (
    <Box
      key={index}
      sx={{
        padding: '3px',
        height: 'fit-content',
        position: 'relative',
        backgroundColor: hasOrigin && record.is_origin === 1 ? '#ff0000' : '',
        '&:hover .img-action': { visibility: 'visible' },
        '&:hover, &.clicked': { backgroundColor: '#003cff' },
      }}
      className={record.status === 1 ? 'clicked' : ''}
    >
      <Box
        sx={{
          borderRadius: '5px',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '3px',
            left: '3px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '5px 0 0 0',
          }}
        >
          <Typography
            variant="body2"
            component="span"
            sx={{
              color: 'white',
              fontSize: '13px',
              fontWeight: 300,
              padding: '5px',
              fontFamily: 'Segoe UI, Tahoma',
              fontStyle: 'bold',
            }}
          >
            {record.date}
          </Typography>
          <Typography
            variant="body2"
            component="span"
            sx={{
              color: 'white',
              fontSize: '13px',
              fontWeight: 300,
              padding: '5px',
              fontFamily: 'Segoe UI, Tahoma',
              fontStyle: 'bold',
            }}
          >
            {record.time}
          </Typography>
        </Box>

        <Box
          key={index}
          component="img"
          sx={{
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
          }}
          src={record.image}
          onClick={() => handleImageClick(record.path, record.image)}
          alt='image'

        />

        <Box
          className="img-action"
          sx={{
            position: 'absolute',
            bottom: '3px',
            right: '3px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            visibility: 'hidden',
          }}
        >
          <Box
            component="img"
            src={viewIcon}
            alt="view icon"
            onClick={() => openSingleImage(record.image, record.path, record.date, record.time)}
            sx={{
              width: '20px',
              height: '20px',
              margin: '5px',
              cursor: 'pointer',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default ImageInList;
