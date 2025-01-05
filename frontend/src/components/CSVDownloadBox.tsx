import DeleteIcon from '@mui/icons-material/Delete'
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import LoginIcon from '@mui/icons-material/Login'
import PreviewIcon from '@mui/icons-material/Preview'
import SettingsIcon from '@mui/icons-material/Settings'
import ThumbsUpDownIcon from '@mui/icons-material/ThumbsUpDown'
import {
  Backdrop,
  Box,
  ClickAwayListener,
  Divider,
  Grid,
  IconButton,
  Popover,
  Snackbar,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Typography,
} from '@mui/material'
import { get, set } from 'lodash'
import { useEffect } from 'react'
import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { appActions, useAppDispatch, useAppSelector } from '../AppState'
import { useLazyGetFeedbackImagesQuery } from '../AppState'
import ImageGrid from '../containers/similarity/image-grid'
import { CSVPreviewPopup } from './Popup/CSVPreviewPopup'
import ConfigEditor from './Popup/settingPopup'
import EvaluationBox from './evaluationBox'
import type { FeedbackQueryParams } from '../types/api'

export const CSVDownloadBox = () => {
  const csvImages = useAppSelector((state) => state.app.csvImages)
  const likeImages = useAppSelector((state) => state.app.likedImages)
  const dislikeImages = useAppSelector((state) => state.app.dislikedImages)
  const queryData = useAppSelector((state) => state.app.data)
  const queryPayload = useAppSelector((state) => state.app.queryPayload)

  const dispatch = useAppDispatch()

  const [anchorElCSV, setAnchorElCSV] = useState<HTMLElement | null>(null)
  const [anchorElLikeDislikePreview, setAnchorElLikeDislikePreview] =
    useState<HTMLElement | null>(null)
  const [anchorElEvaluation, setAnchorElEvaluation] =
    useState<HTMLElement | null>(null)
  const [anchorElSettings, setAnchorElSettings] = useState<HTMLElement | null>(
    null,
  )
  const [speedDialOpen, setSpeedDialOpen] = useState(false) // New state for SpeedDial open
  const CSVPreviewPopupOpen = Boolean(anchorElCSV)
  const LikeDislikePreviewPopupOpen = Boolean(anchorElLikeDislikePreview)
  const isVisible = Boolean(anchorElEvaluation)
  const isSettingsVisible = Boolean(anchorElSettings)
  const Config = useAppSelector((state) => state.app.config)
  const likeLimit = Config.LikeNumber
  const dislikeLimit = Config.DislikeNumber

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
  const handleLikeDislikePreviewOpen = (
    event: React.MouseEvent<HTMLElement>,
  ) => {
    setAnchorElLikeDislikePreview(event.currentTarget)
  }
  const handleLikeDislikePreviewClose = () => {
    if (LikeDislikePreviewPopupOpen) setAnchorElLikeDislikePreview(null)
  }

  const handleSettingsClose = () => {
    setAnchorElSettings(null)
  }

  const [triggerFeedbackQuery, { data, error, isError, isFetching }] =
    useLazyGetFeedbackImagesQuery()

  const handleSubmitFeedback = (event: any) => {
    if (likeImages.length === 0 && dislikeImages.length === 0) {
      toast.error('No images to submit feedback', {
        position: 'bottom-left',
      })
      return
    }

    const feedbackData: FeedbackQueryParams = {
      like: {
        image_urls: likeImages.map(({ img_link }) => img_link),
        prior_scores: likeImages.map(({ score }) => score),
        limit: likeLimit,
      },
      dislike: {
        image_urls: dislikeImages.map(({ img_link }) => img_link),
        limit: dislikeLimit,
      },
      model: queryPayload.model,
      dataset: queryPayload.dataset,
    };    

    triggerFeedbackQuery(feedbackData)

    dispatch(appActions.setLikedImages([]))
    dispatch(appActions.setDislikedImages([]))
    toast.success('Feedback submitted and images cleared', {
      position: 'bottom-left',
    })
  }

  useEffect(() => {
    if (data) {
      const likedImages = data.like
      const likeSimilarImages =
        likedImages.map((image: any) => image.img_link) || []
      const dislikeSimilarImages =
        data.dislike.map((image: any) => image.img_link) || []

      const otherImages = queryData.filter(
        (image: any) => !likeSimilarImages.includes(image.img_link),
      )

      const tempFeedbackImage = [...likedImages, ...otherImages]
      const afterFeedbackImage = tempFeedbackImage.filter(
        (image: any) => !dislikeSimilarImages.includes(image.img_link),
      )

      dispatch(appActions.setAppImageData(afterFeedbackImage))
    }

    if (isError) {
      console.error('Error fetching feedback result:', error)
    }
  }, [data, error, isError])

  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if (e.shiftKey && e.key === 'Enter') {
        e.preventDefault() // Ngăn chặn các hành động mặc định khác của "Enter"
        handleSubmitFeedback(e) // Gọi hàm khi nhấn Shift + Enter
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleSubmitFeedback])

  const ImageBox = ({
    image,
    onDelete,
  }: { image: string; onDelete: () => void }) => {
    return (
      <div
        style={{
          position: 'relative',
          width: '95%',
          height: 'auto',
          margin: '10px',
        }}
      >
        <img
          src={image}
          alt="Disliked"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '7%',
          }}
        />
        <IconButton
          size="small"
          style={{
            position: 'absolute',
            top: '0',
            right: '0',
            color: 'red',
            border: '1px solid red',
          }}
          onClick={onDelete}
        >
          {/* <HighlightOffIcon /> */}
          <DeleteIcon />
        </IconButton>
      </div>
    )
  }

  const handleDeleteDislikedImage = (imageToRemove: any) => {
    const updatedImages = dislikeImages.filter(
      (image) => image !== imageToRemove,
    )
    dispatch(appActions.setDislikedImages(updatedImages))
  }

  const handleDeleteLikedImage = (imageToRemove: any) => {
    const updatedImages = likeImages.filter((image) => image !== imageToRemove)
    dispatch(appActions.setLikedImages(updatedImages))
  }

  return (
    <React.Fragment>
      <ClickAwayListener
        onClickAway={() => {
          setSpeedDialOpen(false)
          handlePreviewCSVClose()
          handleLoginClose()
          handleLikeDislikePreviewClose()
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
              icon={<ThumbsUpDownIcon />}
              tooltipTitle="Preview Liked and Disliked Images"
              onClick={(e) => handleLikeDislikePreviewOpen(e)}
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
            open={LikeDislikePreviewPopupOpen}
            anchorEl={anchorElLikeDislikePreview}
            onClose={handleLikeDislikePreviewClose}
            anchorOrigin={{
              vertical: 'center',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'center',
              horizontal: 'right',
            }}
            marginThreshold={20}
          >
            {likeImages.length === 0 && dislikeImages.length === 0 ? (
              <Typography>No images to preview</Typography>
            ) : (
              <>
                <Grid container direction="row" style={{ width: '90dvw' }}>
                  <Grid
                    item
                    xs={5.9999}
                    style={{ padding: '8px', minHeight: '60dvw' }}
                  >
                    <Typography
                      align="center"
                      variant="h5"
                      style={{ fontWeight: 'bold' }}
                    >
                      Liked Images
                    </Typography>
                    <Grid container direction="row" style={{ width: '100%' }}>
                      {likeImages.map((image, index) => (
                        <Grid
                          item
                          xs={3}
                          style={{ maxHeight: '8dw' }}
                          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                          key={index}
                        >
                          <ImageBox
                            image={image.img_link}
                            onDelete={() => handleDeleteLikedImage(image)}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                  <Grid
                    item
                    xs={0.0002}
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Divider
                      orientation="vertical"
                      flexItem
                      style={{
                        height: '100%',
                        borderRightWidth: '3px',
                        borderRightStyle: 'solid',
                        borderRightColor: '#000',
                      }}
                    />
                  </Grid>

                  <Grid
                    item
                    xs={5.9999}
                    style={{ padding: '8px', minHeight: '60dvw' }}
                  >
                    <Typography
                      align="center"
                      variant="h5"
                      style={{ fontWeight: 'bold' }}
                    >
                      Disliked Images
                    </Typography>

                    <Grid container direction="row" style={{ width: '100%' }}>
                      {dislikeImages.map((image, index) => (
                        <Grid
                          item
                          xs={3}
                          style={{ maxHeight: '8dw' }}
                          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                          key={index}
                        >
                          <ImageBox
                            image={image.img_link}
                            onDelete={() => handleDeleteDislikedImage(image)}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                </Grid>
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
