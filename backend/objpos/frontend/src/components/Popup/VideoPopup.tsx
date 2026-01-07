import { Box, ClickAwayListener } from '@mui/material'
import { isNumber } from 'lodash'
import React, { useCallback, useMemo, useRef, useEffect } from 'react'
import { appActions, useAppDispatch, useAppSelector } from '../../AppState'

const VideoPopup = () => {
  const videoSource = useAppSelector(
    (state) => state.app.videoDataForPopup?.source,
  )
  const timeStamp = useAppSelector(
    (state) => state.app.videoDataForPopup?.timestamp,
  )
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const parsedTimeStamp = useMemo(() => {
    if (!timeStamp) return 0
    if (isNumber(timeStamp)) return timeStamp
    const timeParts = timeStamp.split(':').map(Number)
    if (timeParts.length === 3) {
      return timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2]
    }
    if (timeParts.length === 2) {
      return timeParts[0] * 60 + timeParts[1]
    }
    return timeParts[0]
  }, [timeStamp])

  const videoURLEmbed = useMemo(() => {
    if (videoSource?.includes('youtube.com')) {
      const url = new URL(videoSource)
      const videoId = url.searchParams.get('v')
      // console.log(videoId, parsedTimeStamp);
      return `https://www.youtube.com/embed/${videoId}?start=${parsedTimeStamp}&rel=0&autoplay=1`
    }
    return videoSource
  }, [videoSource, parsedTimeStamp])

  const dispatch = useAppDispatch()
  const closeVideoPopup = useCallback(() => {
    dispatch(
      appActions.setVideoDataForPopup({
        source: undefined,
        timeStamp: undefined,
      }),
    )
  }, [dispatch])

  const playbackRate = 1.5 // Adjust this value to change the playback speed

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = parsedTimeStamp
      videoRef.current.playbackRate = playbackRate
    }
  }, [parsedTimeStamp])

  return (
    <Box
      className="video-popup"
      sx={{
        zIndex: '99999',
        position: 'fixed',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        backgroundColor: 'rgba(110, 110, 110, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ClickAwayListener onClickAway={closeVideoPopup}>
        {videoURLEmbed ? (
          <Box
            className="video-container"
            sx={{ backgroundColor: '#fff', height: '80%', width: '90%' }}
          >
            {videoSource?.includes('youtube.com') ? (
              <iframe
                width="100%"
                height="100%"
                style={{ objectFit: 'contain' }}
                src={videoURLEmbed}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video ref={videoRef} width="560" height="315" controls>
                <source src={videoSource} type="video/mp4" />
                <track
                  src="captions.vtt"
                  kind="captions"
                  label="English"
                  default
                />
                Your browser does not support the video tag.
              </video>
            )}
          </Box>
        ) : (
          <Box>Video source not found!</Box>
        )}
      </ClickAwayListener>
    </Box>
  )
}

export default VideoPopup
