import React from 'react';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PlayCircleFilledRoundedIcon from '@mui/icons-material/PlayCircleFilledRounded';
import { useAppDispatch, useAppSelector, appActions } from '../AppState';
import type { ImageRecord } from '../types/image';
import { isNil } from 'lodash';
import { Box } from '@mui/material';

interface AnImageProps {
  data: ImageRecord | null | undefined;
  index?: number;
  isDisplayTooltip?: boolean;
  isZoomOnHover?: boolean;
}

const AnImage: React.FC<AnImageProps> = ({ data, index, isDisplayTooltip, isZoomOnHover }) => {
  if (isNil(data)) return null;
  isDisplayTooltip = isDisplayTooltip !== undefined ? isDisplayTooltip : true;
  isZoomOnHover = isZoomOnHover !== undefined ? isZoomOnHover : true;

  const src = data?.img_link ? data.img_link : undefined;
  const videoSrc = data?.video_link ? data.video_link : undefined;
  const date = data?.date ? data.date : null;
  const time = data?.time ? data.time : null;
  const formattedTime: string = `${date ? date : ''}  ${time ? time : ''}`;
  const json_data: string | null = isDisplayTooltip ? JSON.stringify(data) : null;

  const dispatch = useAppDispatch();

  const toggleNeighborPopup = React.useCallback((data: any) => {
    dispatch(appActions.setNeighborPopupData(data));
  }, [dispatch]);

  const toggleSimilarPopup = React.useCallback((data: any) => {
    dispatch(appActions.setSimilarPopupData(data));
  }, [dispatch]);

  return (
    <Box
      key={index}
      sx={{
        position: 'relative',
        width: '100% !important',
        height: '100%',
        overflow: 'hidden',
        borderRadius: '0.5rem', // For rounded corners
        alignItems: 'center',
        justifyContent: 'center',
        display: 'flex',
        transition: isZoomOnHover ? 'transform 0.3s ease-in-out' : undefined,
        // transform: isZoomOnHover ? 'scale(1.05)' : undefined,
        zIndex: isZoomOnHover ? 50 : undefined,
        '&:hover': {
          transform: isZoomOnHover ? 'scale(1.05)' : undefined,
          border: isZoomOnHover ? '2px solid rgb(0, 47, 255)' : undefined,
          "& .img-action-eye": {
            display: isZoomOnHover ? 'flex' : 'hidden',
          }
        },
      }}
      data-tooltip-id="tooltip_img"
      data-tooltip-content={json_data}
      data-tooltip-variant="dark"
      onDoubleClick={(e) => {
        e.preventDefault();
        toggleSimilarPopup(data);
        toggleNeighborPopup(null);
      }}
    >

      {(date || time )&& (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            padding: '0.25rem',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            fontSize: '0.75rem',
          }}
        >
          {formattedTime}
        </Box> 
      )}
      <Box
        component="img"
        src={src}
        className='image-item-img'
        alt={`${index}`}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          cursor: 'pointer',
          backgroundColor: 'white',
        }}
      />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            opacity: 0.5,
            zIndex: 50,
            display: 'none',
            flexDirection: 'row',
          }}
          className="img-action-eye"
          
        >
          <VisibilityOutlinedIcon 
            titleAccess='View Neighbors'
            style={{ width: '1.75rem', color: 'white', cursor: 'pointer' }} 
            onClick={(e) => {
              e.preventDefault();
              toggleNeighborPopup(data);
              toggleSimilarPopup(null);
            }} 
          />
          { videoSrc && (<PlayCircleFilledRoundedIcon 
            titleAccess='View Video'
            style={{ width: '1.75rem', color: 'white', cursor: 'pointer' }} 
            onClick={(e) => {
              e.preventDefault();
              console.log('videoSrc:', videoSrc);
              dispatch(appActions.setVideoDataForPopup({
                source: videoSrc,
                timeStamp: time,
              }));
            }}
          />)}
        </Box>

    </Box>
  );
};

export default AnImage;
