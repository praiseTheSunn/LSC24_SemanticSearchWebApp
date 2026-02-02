import PlayCircleFilledRoundedIcon from '@mui/icons-material/PlayCircleFilledRounded'
import ThumbDownIcon from '@mui/icons-material/ThumbDown'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Box } from '@mui/material'
import { isNil } from 'lodash'
import React from 'react'
import { toast } from 'react-toastify'
import { appActions, useAppDispatch, useAppSelector } from '../AppState'
import { useSubmitKISAnsweringMutation } from '../AppState'
import { AddDislikeAction } from '../config/dislikeResponse'
import { AddLikeAction } from '../config/likeResponse'
import { AIC_addImages, AIC_addTrakeImages, VBS_addImages } from '../config/submitFunc'
import type { ImageRecord } from '../types/image'
import { useState, useEffect } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import { formatTimeByDataset } from '../utils/formatTime'



interface AnImageProps {
  data: ImageRecord | null | undefined
  index?: number
  isDisplayTooltip?: boolean
  isZoomOnHover?: boolean
  allowFeedback?: boolean
  isTrake?: boolean
}

const AnImage: React.FC<AnImageProps> = ({
  data,
  index,
  isDisplayTooltip,
  isZoomOnHover,
  allowFeedback,
  isTrake = false,
}) => {
  if (isNil(data)) return null
  isDisplayTooltip = isDisplayTooltip !== undefined ? isDisplayTooltip : true
  isZoomOnHover = isZoomOnHover !== undefined ? isZoomOnHover : true
  allowFeedback = allowFeedback !== undefined ? allowFeedback : true

  const src = data?.img_link ? data.img_link : undefined
  const videoSrc = data?.video_url ? data.video_url : undefined
  const record_id = data?.record_id ? data.record_id : null
  const date = data?.date ? data.date : null
  const time = data?.time ? data.time : ""
  const minutes = Number.parseInt(time.substring(0, 2))  // "01" -> 1
  const seconds = Number.parseInt(time.substring(3, 5))  // "35" -> 35
  const timestamp = minutes * 60 + seconds
  // const timestamp = data?.timestamp ? data.timestamp * 1000 : null
  // const timestamp = time.substring(1, 2) + time.substring(3, 5)
  // const formattedTime: string = `${date ? date.slice(0, date.length - 4) : ''}-${timestamp ? timestamp : ''}-${time ? time : ''}`
  // const formattedTime: string = `${date ? date : ''}-${time ? time : ''}`
  
  // Get dataset from app state
  const dataset = useAppSelector((state) => state.app.queryPayload.dataset)
  
  // Get the correct formattedTime function based on dataset
  const formattedTime: string = formatTimeByDataset(dataset, src ?? '', date ?? '', time)
  const json_data: string | null = isDisplayTooltip
    ? JSON.stringify(data)
    : null

  const dispatch = useAppDispatch()

  const toggleNeighborPopup = React.useCallback(
    (data: any) => {
      dispatch(appActions.setNeighborPopupData(data))
    },
    [dispatch],
  )

  const toggleSimilarPopup = React.useCallback(
    (data: any) => {
      dispatch(appActions.setSimilarPopupData(data))
    },
    [dispatch],
  )

  const toggleImagePreview = React.useCallback(
    (data: any) => {
      dispatch(appActions.setImagePreview(data))
    },
    [dispatch],
  )

  const toggleSubmitData = React.useCallback(
    (data: any) => {
      dispatch(appActions.setSubmitData(data))
    },
    [dispatch],
  )

  const csvData = useAppSelector((state) => state.app.csvImages)
  const trakeData = useAppSelector((state) => state.app.trakedImages)
  const likeImages = useAppSelector((state) => state.app.likedImages)
  const dislikeImages = useAppSelector((state) => state.app.dislikedImages)

  const [triggerKIS, resultKIS] = useSubmitKISAnsweringMutation()
  const submit = (src_data: ImageRecord) => {
    // const toastId = toast.loading(`Submitting: ${src_data.img_link}`, {
    //   position: 'bottom-right',
    //   closeOnClick: true,
    //   autoClose: 1000,
    // })

    // REPLACE FOR EACH COMPETITION HERE
    // AIC_addCSVImages(src_data, null, dispatch, csvData)
    // AIC_addImages(src_data, triggerKIS)
    VBS_addImages(src_data, triggerKIS)
  }

  const addTrakeImages = (src: ImageRecord) => {
    AIC_addTrakeImages(src, null, dispatch, trakeData)
  }

  const removeTrakeImage = (src: ImageRecord) => {
    const updated = trakeData.filter((img) => img !== src)
    dispatch(appActions.setTrakedImages(updated))
  }


  const like = (src_data: ImageRecord) => {
    const toastId = toast.loading(`Like: ${src_data.img_link}`, {
      position: 'bottom-right',
      closeOnClick: true,
      autoClose: 2000,
    })

    // REPLACE FOR EACH COMPETITION HERE
    if (!likeImages.includes(src_data)) {
      AddLikeAction(src_data, toastId, dispatch, likeImages)
    }
  }

  const dislike = (src_data: ImageRecord) => {
    const toastId = toast.loading(`Dislike: ${src_data.img_link}`, {
      position: 'bottom-right',
      closeOnClick: true,
      autoClose: 2000,
    })

    // REPLACE FOR EACH COMPETITION HERE
    if (!dislikeImages.includes(src_data)) {
      AddDislikeAction(src_data, toastId, dispatch, dislikeImages)
    }
  }

  // const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) {
      submit(data)
    }
    if (e.altKey) {
      toggleSubmitData(data)
    }
    if (e.shiftKey) {
      addTrakeImages(data)
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    toggleSimilarPopup(data)
    toggleNeighborPopup(null)
  }

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
          '& .img-action-eye': {
            display: isZoomOnHover ? 'flex' : 'hidden',
          },
        },
      }}
      data-tooltip-id="tooltip_img"
      data-tooltip-content={json_data}
      data-tooltip-variant="dark"
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
      onMouseEnter={(e) => {
        e.preventDefault()
        if (e.shiftKey) {
          toggleImagePreview(data)
        }
      }}
      onMouseLeave={() => {
        toggleImagePreview(null) // Reset the preview when the mouse leaves
      }}
    >
      {(formattedTime.length > 0) && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            padding: '0.25rem',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
        className="image-item-img submissible"
        alt={`${index}`}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          cursor: 'pointer',
          backgroundColor: 'white',
        }}
      />
      {isTrake && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.6)',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(255,0,0,0.8)',
            },
          }}
          onClick={(e) => {
            e.stopPropagation() // prevent triggering other image events
            removeTrakeImage(data)
          }}
        >
          <CloseIcon sx={{ color: 'white', fontSize: '16px' }} />
        </Box>
      )}

      {allowFeedback && <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          opacity: 0.8,
          zIndex: 50,
          padding: '0.5rem',
          display: 'none',
          flexDirection: 'column',
          gap: '0.25rem',
        }}
        className="img-action-eye"
      >
        <ThumbUpIcon
          sx={{ color: 'blue', cursor: 'pointer' }}
          titleAccess="Like"
          onClick={(e) => {
            e.preventDefault()
            // Add your like action here
            like(data)
          }}
        />
        <ThumbDownIcon
          sx={{ width: '1.75rem', color: 'red', cursor: 'pointer' }}
          titleAccess="Dislike"
          onClick={(e) => {
            e.preventDefault()
            // Add your dislike action here
            dislike(data)
          }}
        />
      </Box>}
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
          titleAccess="View Neighbors"
          style={{ width: '1.75rem', color: 'white', cursor: 'pointer' }}
          onClick={(e) => {
            e.preventDefault()
            toggleNeighborPopup(data)
            toggleSimilarPopup(null)
            dispatch(appActions.setTrakedImages([]))
          }}
        />
        {videoSrc && (
          <PlayCircleFilledRoundedIcon
            titleAccess="View Video"
            style={{ width: '1.75rem', color: 'white', cursor: 'pointer' }}
            onClick={(e) => {
              e.preventDefault()
              dispatch(
                appActions.setVideoDataForPopup({
                  source: videoSrc,
                  timestamp: timestamp ? timestamp : undefined,
                }),
              )
            }}
          />
        )}
      </Box>
    </Box>
  )
}

export default AnImage