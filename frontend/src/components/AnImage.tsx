import React from 'react';
import view_icon from '../assets/view_icon.png';
import { useAppDispatch, useAppSelector, appActions } from '../AppState';
import type { ImageRecord } from '../types/image';
import { isNil, spread } from 'lodash';
import { Box } from '@mui/material';

interface AnImageProps {
  data: ImageRecord;
  index?: number;
  isDisplayTooltip?: boolean;
  isZoomOnHover?: boolean;
}

const AnImage: React.FC<AnImageProps> = ({ data, index, isDisplayTooltip, isZoomOnHover }) => {
  isDisplayTooltip = isDisplayTooltip !== undefined ? isDisplayTooltip : true;
  isZoomOnHover = isZoomOnHover !== undefined ? isZoomOnHover : true;
  console.log('izoomonhover:', isZoomOnHover);  

  const src = data?.img_link ? data.img_link : undefined;
  const date = data?.date ? data.date : null;
  const time = data?.time ? data.time : null;
  const formattedTime: string = `${date}  ${time}`;
  const json_data: string | null = isDisplayTooltip ? JSON.stringify(data) : null;

  const dispatch = useAppDispatch();
  const isNeighborPopupOpened: boolean = useAppSelector(
    (state) => state.app.neighborPopUpData,
    isNil,
  );
  const isSimilarPopupOpened: boolean = useAppSelector(
    (state) => state.app.similarPopUpData,
    isNil,
  );

  const toggleNeighborPopup = React.useCallback((data: any) => {
    dispatch(appActions.setNeighborPopupData(data));
  }, [dispatch, isNeighborPopupOpened]);

  const toggleSimilarPopup = React.useCallback((data: any) => {
    dispatch(appActions.setSimilarPopupData(data));
  }, [dispatch, isSimilarPopupOpened]);

  return (
    <Box
      key={index}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: '0.5rem', // For rounded corners
        transition: isZoomOnHover ? 'transform 0.3s ease-in-out' : undefined,
        transform: isZoomOnHover ? 'scale(1.05)' : undefined,
        zIndex: isZoomOnHover ? 50 : undefined,
        // Apply hover effect using a pseudo-class approach if needed
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
      {isZoomOnHover && (
        <style>
          {'.an-img-container:hover .img-action-eye { display: block; }'}
          {'.an-img-container:hover .image-item-img { border: 2px solid rgb(0, 47, 255); }'}
        </style>
      )}

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
      <Box
        component="img"
        src={src}
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
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          opacity: 0.5,
          zIndex: 50,
          display: 'none', // Handle hover effect using JS or CSS
        }}
        onClick={(e) => {
          e.preventDefault();
          toggleNeighborPopup(data);
          toggleSimilarPopup(null);
        }}
        {...spread}
      >
        <Box component="img" src={view_icon} alt={`View ${index}`} style={{ width: '1.75rem' }} />
      </Box>
    </Box>
  );
};

export default AnImage;
