import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import LoginIcon from '@mui/icons-material/Login'
import PreviewIcon from '@mui/icons-material/Preview'
import SettingsIcon from '@mui/icons-material/Settings'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import ThumbDownIcon from '@mui/icons-material/ThumbDown'
import FeedbackIcon from '@mui/icons-material/Feedback';
import { useEffect } from 'react'
import {
  Backdrop,
  Box,
  ClickAwayListener,
  Popover,
  Snackbar,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Typography,
} from '@mui/material'
import { get, set } from 'lodash'
import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { appActions, useAppDispatch, useAppSelector } from '../AppState'
import ImageGrid from '../containers/similarity/image-grid'
import { CSVPreviewPopup } from './Popup/CSVPreviewPopup'
import ConfigEditor from './Popup/settingPopup'
import EvaluationBox from './evaluationBox'
import DeleteIcon from '@mui/icons-material/Delete';
import { useGetFeedbackImagesQuery } from '../AppState'

export const CSVDownloadBox = () => {
  const csvImages = useAppSelector((state) => state.app.csvImages)
  const likeImages = useAppSelector((state) => state.app.likedImages)
  const dislikeImages = useAppSelector((state) => state.app.dislikedImages)
  const textQuery = useAppSelector((state) => state.app.textQuery)
  const queryData = useAppSelector((state) => state.app.data)
  const dispatch = useAppDispatch()

  const [anchorElCSV, setAnchorElCSV] = useState<HTMLElement | null>(null)
  const [anchorElLikePreview, setAnchorElLikePreview] = useState<HTMLElement | null>(null)
  const [anchorElDislikePreview, setAnchorElDislikePreview] = useState<HTMLElement | null>(null)
  const [anchorElEvaluation, setAnchorElEvaluation] =
    useState<HTMLElement | null>(null)
  const [anchorElSettings, setAnchorElSettings] = useState<HTMLElement | null>(
    null,
  )
  const [speedDialOpen, setSpeedDialOpen] = useState(false) // New state for SpeedDial open
  const CSVPreviewPopupOpen = Boolean(anchorElCSV)
  const LikePreviewPopupOpen = Boolean(anchorElLikePreview)
  const DislikePreviewPopupOpen = Boolean(anchorElDislikePreview)
  const isVisible = Boolean(anchorElEvaluation)
  const isSettingsVisible = Boolean(anchorElSettings)

  const handleDownloadCSV = () => {
    if (csvImages.length > 0) {
      const csv = csvImages
        .map((image) => `${image.video_id}, ${image.frame_id}\n`)
        .join('')
      const hiddenElement = document.createElement('a')
      hiddenElement.href = `data:text/csv;charset=utf-8,${encodeURI(csv)}`
      hiddenElement.target = '_blank'
      hiddenElement.download = 'images.csv'
      hiddenElement.click()
    } else {
      toast.error('No images to download', {
        position: 'bottom-left',
      })
    }
  }

  const handleClearCSV = () => {
    dispatch(appActions.setCSVImages([]))
    toast.success('Cleared', {
      position: 'bottom-left',
    })
  }

  const handleClearLike = () => {
    dispatch(appActions.setLikedImages([]))
    toast.success('Cleared Liked Images', {
      position: 'bottom-left',
    })
  }

  const handleClearDislike = () => {
    dispatch(appActions.setDislikedImages([]))
    toast.success('Cleared Disliked Images', {
      position: 'bottom-left',
    })
  }

  const handlePreviewCSVOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElCSV(event.currentTarget)
  }

  const handlePreviewCSVClose = () => {
    if (CSVPreviewPopupOpen) setAnchorElCSV(null)
  }

  const handleLoginOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElEvaluation(event.currentTarget)
  }

  const handleLoginClose = () => {
    setAnchorElEvaluation(null)
  }

  const handleSettingsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElSettings(event.currentTarget)
  }

  const handleLikePreviewOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElLikePreview(event.currentTarget)
  }

  const handleLikePreviewClose = () => {
    if (LikePreviewPopupOpen) setAnchorElLikePreview(null)
  }

  const handleDislikePreviewOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElDislikePreview(event.currentTarget)
  }

  const handleDislikePreviewClose = () => {
    if (DislikePreviewPopupOpen) setAnchorElDislikePreview(null)
  }

  const handleSettingsClose = () => {
    setAnchorElSettings(null)
  }
  
  const [feedback, setFeedback] = useState(null)
  const [likeSimilarImages, setLikeSimilarImages] = useState([])
  const [dislikeSimilarImages, setDislikeSimilarImages] = useState([])

  
  const handleSubmitFeedback = (event: React.MouseEvent<HTMLElement>) => {
    const like = {
      text_query: textQuery,
      image_urls: likeImages.map((image) => image.img_link),
      model: "clip",
      limit: 30,
    }
    const dislike = {
      text_query: 'dislike',
      image_urls: dislikeImages.map((image) => image.img_link),
      model: "clip",
      limit: 30,
    }
    const feedbackData = {
      like: like,
      dislike: dislike,
    }
    setFeedback(feedbackData)
    // console.log('Feedback data:', feedbackData)
  }

  const feedbackResult = useGetFeedbackImagesQuery(feedback)
  const { data, error, isError, isFetching } = feedbackResult

  // useGetFeedbackImagesQuery(feedback)
  useEffect(() => {
    if (feedbackResult) {
      if (data) {
        // console.log('Feedback like result data:', data.like[0])
        // console.log('Feedback dislike result data:', data.dislike[0])
        // dispatch(appActions.setLikedSimilarImages(data.like[0]))
        // dispatch(appActions.setDislikedSimilarImages(data.dislike[0]))
        const likeSimilarImages = data.like[0].map((image: any) => image.img_link)
        const dislikeSimilarImages = data.dislike[0].map((image: any) => image.img_link)

        const afterFeedbackImage = queryData
        // Loại bỏ các ảnh có img_link trong dislikeSimilarImages
        .filter((image: any) => !dislikeSimilarImages.includes(image.img_link))
        // Sắp xếp ảnh có img_link trong likeSimilarImages lên đầu
        .sort((a: any, b: any) => {
          const aLiked = likeSimilarImages.includes(a.img_link);
          const bLiked = likeSimilarImages.includes(b.img_link);
      
          if (aLiked && !bLiked) {
            return -1; // Ưu tiên a
          } else if (!aLiked && bLiked) {
            return 1; // Ưu tiên b
          } else {
            return 0; // Giữ nguyên vị trí
          }
        });
          
        // console.log('afterFeedbackImage:', afterFeedbackImage)
        dispatch(appActions.setAppImageData(afterFeedbackImage))
        
      }
      if (isError) {
        console.error('Error fetching feedback result:', error)
      }
    }
  }, [feedbackResult])

  return (
    <React.Fragment>
      <ClickAwayListener
        onClickAway={() => {
          setSpeedDialOpen(false)
          handlePreviewCSVClose()
          handleLoginClose()
          handleLikePreviewClose()
          handleDislikePreviewClose()
        }}
      >
        <Box
          sx={{
            position: 'relative',
            alignItems: 'flex-start',
            width: '50px',
            height: '100%',
            display: 'flex',
          }}
        >
          <SpeedDial
            ariaLabel="CSV actions"
            sx={{
              position: 'absolute',
              zIndex: 10000,
            }}
            icon={
              <SpeedDialIcon
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                }}
                onClick={() => setSpeedDialOpen(!speedDialOpen)}
              />
            }
            direction="down"
            open={speedDialOpen}
            onMouseEnter={() => setSpeedDialOpen(true)}
            FabProps={{ size: 'medium' }}
          >
            <SpeedDialAction
              icon={<FileDownloadIcon />}
              tooltipTitle="Download CSV"
              onClick={handleDownloadCSV}
            />
            <SpeedDialAction
              icon={<DeleteForeverRoundedIcon />}
              tooltipTitle="Clear CSV"
              onClick={() => handleClearCSV()}
            />
            <SpeedDialAction
              icon={<PreviewIcon />}
              tooltipTitle="Preview CSV"
              onClick={(e) => handlePreviewCSVOpen(e)}
            />
            <SpeedDialAction
              icon={<LoginIcon />}
              tooltipTitle="Login"
              onClick={(e) => handleLoginOpen(e)}
            />
            <SpeedDialAction
              icon={<SettingsIcon />}
              tooltipTitle="Settings"
              onClick={(e) => handleSettingsOpen(e)}
            />
            <SpeedDialAction
              icon={<ThumbUpIcon />}
              tooltipTitle="Preview Liked Images"
              onClick={(e) => handleLikePreviewOpen(e)}      
            />  
            <SpeedDialAction
              icon={<ThumbDownIcon />}
              tooltipTitle="Preview Dislike Images"
              onClick={(e) => handleDislikePreviewOpen(e)}
            />
            <SpeedDialAction
              icon={<FeedbackIcon />}
              tooltipTitle="Submit feedback"
              onClick={(e) => handleSubmitFeedback(e)}
            />
            
          </SpeedDial>
          <Popover
            open={CSVPreviewPopupOpen}
            anchorEl={anchorElCSV}
            onClose={handlePreviewCSVClose}
            anchorOrigin={{
              vertical: 'center',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'center',
              horizontal: 'right',
            }}
            marginThreshold={20}
            PaperProps={{
              sx: {
                minWidth: '200px',
                minHeight: '50px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              },
            }}
          >
            {csvImages.length === 0 ? (
              <Typography>No images to preview</Typography>
            ) : (
              <ImageGrid
                style={{ width: '90dvw', minHeight: '60dvw' }}
                data={csvImages}
              />
            )}
          </Popover>

          <Popover
            open={LikePreviewPopupOpen}
            anchorEl={anchorElLikePreview}
            onClose={handleLikePreviewClose}
            anchorOrigin={{
              vertical: 'center',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'center',
              horizontal: 'right',
            }}
            marginThreshold={20}
            PaperProps={{
              sx: {
                minWidth: '200px',
                minHeight: '50px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              },
            }}
          >
            {likeImages.length === 0 ? (
              <Typography>No images to preview</Typography>
            ) : (
              <>
              {/* Add delete Icon here add the right corner of the row */}
              <DeleteIcon onClick={handleClearLike} style={{right: '0', top: '0'}}/>
              <ImageGrid
                style={{ width: '90dvw', minHeight: '60dvw' }}
                data={likeImages}
              />
              </>
            )}
          </Popover>

          <Popover
            open={DislikePreviewPopupOpen}
            anchorEl={anchorElDislikePreview}
            onClose={handleDislikePreviewClose}
            anchorOrigin={{
              vertical: 'center',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'center',
              horizontal: 'right',
            }}
            marginThreshold={20}
            PaperProps={{
              sx: {
                minWidth: '200px',
                minHeight: '50px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              },
            }}
          >
            {dislikeImages.length === 0 ? (
              <Typography>No images to preview</Typography>
            ) : (
              <>
              {/* Add delete Icon here add the right corner of the row */}
              <DeleteIcon onClick={handleClearDislike} style={{right: '0', top: '0'}}/>
              <ImageGrid
                style={{ width: '90dvw', minHeight: '60dvw' }}
                data={dislikeImages}
              />
              </>
            )}
          </Popover>

          <Popover
            open={isVisible}
            anchorEl={anchorElEvaluation}
            onClose={handleLoginClose}
            anchorOrigin={{
              vertical: 'center',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'center',
              horizontal: 'right',
            }}
          >
            <EvaluationBox />
          </Popover>
          <Popover
            open={isSettingsVisible}
            anchorEl={anchorElSettings}
            onClose={handleSettingsClose}
            anchorOrigin={{
              vertical: 'center',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'center',
              horizontal: 'right',
            }}
          >
            <ConfigEditor />
          </Popover>
        </Box>
      </ClickAwayListener>
      {/* <Backdrop open={speedDialOpen} sx={(theme) => ({ zIndex: theme.zIndex.speedDial + 1 })} /> */}
    </React.Fragment>
  )
}
