import React from 'react';
import view_icon from '../assets/view_icon.png';
import { useAppDispatch, useAppSelector, appActions } from '../AppState';
import type { ImageRecord } from '../types/image';
import { isNil, spread } from 'lodash';

interface AnImageProps {
  data: ImageRecord;
  index?: number;
  isDisplayTooltip?: boolean;
  isZoomOnHover?: boolean;
}

const AnImage: React.FC<AnImageProps> = ({ data, index, isDisplayTooltip, isZoomOnHover }) => {
  isDisplayTooltip = isDisplayTooltip !== undefined ? isDisplayTooltip : true;
  isZoomOnHover = isZoomOnHover !== undefined ? isZoomOnHover : true;

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
    if (isNeighborPopupOpened) {
      dispatch(appActions.closeNeighborPopUp());
    } else {
      dispatch(appActions.openNeighborPopUp(data));
    }
  }, [dispatch, isNeighborPopupOpened]);

  const toggleSimilarPopup = React.useCallback((data: any) => {
    if (isSimilarPopupOpened) {
      dispatch(appActions.closeSimilarPopUp());
    } else {
      dispatch(appActions.openSimilarPopUp(data));
    }
  }, [dispatch, isSimilarPopupOpened]);

  return (
    <div
      key={index}
      style={{
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

      <div
        style={{
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
      </div>
      <img
        src={src}
        alt={`${index}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          cursor: 'pointer',
          backgroundColor: 'white',
        }}
      />
      <div
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
        <img src={view_icon} alt={`View ${index}`} style={{ width: '1.75rem' }} />
      </div>
    </div>
  );
};

export default AnImage;
