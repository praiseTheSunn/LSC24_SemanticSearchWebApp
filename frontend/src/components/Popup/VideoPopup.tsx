import { Box, ClickAwayListener } from '@mui/material'
import { appActions, useAppDispatch, useAppSelector } from '../../AppState'
import './loadingPopup.css'
import React, { useCallback } from 'react'

interface VideoPopupProps {
  videoSource: string; // Accepts the video source (YouTube link or video file)
}

const VideoPopup: React.FC<VideoPopupProps> = ({ videoSource }) => {
  
  const dispatch = useAppDispatch();
  const closeVideoPopup = useCallback(() => {
    dispatch(appActions.setVideoDataForPopup(null));
  }, [dispatch]);

  return (
    <Box className="loading-popup" style={{ zIndex: '99999' }}>
      <ClickAwayListener onClickAway={closeVideoPopup}>
        <Box className="video-container">
          {videoSource.includes('youtube.com') ? (
            <iframe
              width="560"
              height="315"
              src={videoSource}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video width="560" height="315" controls>
              <source src={videoSource} type="video/mp4" />
              <track src="captions.vtt" kind="captions" label="English" default />
              Your browser does not support the video tag.
            </video>
          )}
        </Box>
      </ClickAwayListener>
    </Box>
  )
}

export default React.memo(VideoPopup)
