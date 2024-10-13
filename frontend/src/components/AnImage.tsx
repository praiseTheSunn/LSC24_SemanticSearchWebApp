import PlayCircleFilledRoundedIcon from '@mui/icons-material/PlayCircleFilledRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Box } from '@mui/material'
import { isNil } from 'lodash'
import React from 'react'
import { toast } from 'react-toastify'
import { appActions, useAppDispatch, useAppSelector } from '../AppState'
import { LSC_addCSVImages } from '../config/submitFunc'
import { AddLikeAction } from '../config/likeResponse'
import { AddDislikeAction } from '../config/dislikeResponse'
import type { ImageRecord } from '../types/image'
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

interface AnImageProps {
  data: ImageRecord | null | undefined
  index?: number
  isDisplayTooltip?: boolean
  isZoomOnHover?: boolean
}

const AnImage: React.FC<AnImageProps> = ({
  data,
  index,
  isDisplayTooltip,
  isZoomOnHover,
}) => {
  if (isNil(data)) return null
  isDisplayTooltip = isDisplayTooltip !== undefined ? isDisplayTooltip : true
  isZoomOnHover = isZoomOnHover !== undefined ? isZoomOnHover : true

  const src = data?.img_link ? data.img_link : undefined
  const videoSrc = data?.video_url ? data.video_url : undefined
  const date = data?.date ? data.date : null
  const time = data?.time ? data.time : null
  const formattedTime: string = `${date ? date : ''}  ${time ? time : ''}`
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

  const imageDatas = useAppSelector((state) => state.app.data)
  const csvData = useAppSelector((state) => state.app.csvImages)
  const likeImages = useAppSelector((state) => state.app.likedImages)
  const dislikeImages = useAppSelector((state) => state.app.dislikedImages)

  const submit = (src_data: ImageRecord) => {
    const toastId = toast.loading(`Submitting: ${src_data.img_link}`, {
      position: 'bottom-right',
      closeOnClick: true,
      autoClose: 2000,
    })

    // REPLACE FOR EACH COMPETITION HERE
    LSC_addCSVImages(src_data, toastId, imageDatas, dispatch, csvData)
  }

  const like = (src_data: ImageRecord) => {
    const toastId = toast.loading(`Like: ${src_data.img_link}`, {
      position: 'bottom-right',
      closeOnClick: true,
      autoClose: 2000,
    })

    // REPLACE FOR EACH COMPETITION HERE
    AddLikeAction(src_data, toastId, dispatch, likeImages)
  }

  const dislike = (src_data: ImageRecord) => {
    console.log('src', src_data.img_link)
    const toastId = toast.loading(`Dislike: ${src_data.img_link}`, {
      position: 'bottom-right',
      closeOnClick: true,
      autoClose: 2000,
    })

    // REPLACE FOR EACH COMPETITION HERE
    AddDislikeAction(src_data, toastId, dispatch, dislikeImages)
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
      onDoubleClick={(e) => {
        e.preventDefault()
        toggleSimilarPopup(data)
        toggleNeighborPopup(null)
      }}
      onClick={(e) => {
        e.preventDefault()
        if (e.ctrlKey) {
          submit(data)
        }
      }}
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
      {(date || time) && (
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
      <Box
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
            e.preventDefault();
            // Add your like action here
            like(data)
          }}
        />
        <ThumbDownIcon
          sx={{ width: '1.75rem', color: 'red', cursor: 'pointer' }}
          titleAccess="Dislike"
          onClick={(e) => {
            e.preventDefault();
            // Add your dislike action here
            dislike(data)
          }}
        />
      </Box>
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
                  timestamp: data.timestamp ? data.timestamp : undefined,
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
