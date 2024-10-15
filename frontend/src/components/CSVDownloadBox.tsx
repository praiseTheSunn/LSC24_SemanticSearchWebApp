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
import {
  useGetFeedbackImagesQuery,
  useGetFeedbackLikedImagesQuery,
  useGetFeedbackDislikedImagesQuery
} from '../AppState'

export const CSVDownloadBox = () => {
  const csvImages = useAppSelector((state) => state.app.csvImages)
  const likeImages = useAppSelector((state) => state.app.likedImages)
  const dislikeImages = useAppSelector((state) => state.app.dislikedImages)
  const textQuery = useAppSelector((state) => state.app.textQuery)
  const queryData = useAppSelector((state) => state.app.data)
  const queryPayload = useAppSelector((state) => state.app.queryPayload)

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

  const handleSubmitFeedback = (event: any) => {
    if (likeImages.length === 0 && dislikeImages.length === 0) {
      toast.error('No images to submit feedback', {
        position: 'bottom-left',
      })
    }
    else {
      const feedbackData: any = {};
      if (likeImages.length !== 0) {
        feedbackData.like = {
          text_query: textQuery,
          image_urls: likeImages.map((image) => image.img_link),
          model: "clip",
          limit: likeLimit,
          dataset: "aic24"
        };
      }

      if (dislikeImages.length !== 0) {
        feedbackData.dislike = {
          image_urls: dislikeImages.map((image) => image.img_link),
          model: "clip",
          limit: dislikeLimit,
          dataset: "aic24"
        };
      }

      if (likeImages.length !== 0 && dislikeImages.length !== 0)
        feedbackData.dataset = "aic24";
      console.log('Feedback data:', feedbackData)
      setFeedback(feedbackData);

    }
    // console.log('Feedback data:', feedbackData)
    dispatch(appActions.setLikedImages([]))
    dispatch(appActions.setDislikedImages([]))
    toast.success('Feedback submitted and images cleared', {
      position: 'bottom-left',
    });
  }
  
  const likeFeedback = feedback?.like
  ? feedback.like 
  : null;

  const dislikeFeedback = feedback?.dislike
    ? feedback.dislike
    : null;

  const feedbackImagesResult = useGetFeedbackImagesQuery(feedback, {
    skip: !(feedback?.like && feedback?.dislike), // Chỉ gọi khi có cả like và dislike
  });

  const feedbackLikedImagesResult = useGetFeedbackLikedImagesQuery(likeFeedback, {
    skip: !(feedback?.like && !feedback?.dislike), // Chỉ gọi khi chỉ có like
  });

  const feedbackDislikedImagesResult = useGetFeedbackDislikedImagesQuery(dislikeFeedback, {
    skip: !(feedback?.dislike && !feedback?.like), // Chỉ gọi khi chỉ có dislike
  });

  // Chọn kết quả phù hợp
  let feedbackResult = null;
  if (feedback?.like && feedback?.dislike) {
    feedbackResult = feedbackImagesResult;
  } else if (feedback?.like) {
    feedbackResult = feedbackLikedImagesResult;
  } else if (feedback?.dislike) {
    feedbackResult = feedbackDislikedImagesResult;
  }
  const { data, error, isError, isFetching } = feedbackResult || {};


  useEffect(() => {
    if (feedbackResult) {
      if (data) {
        let likeSimilarImages = []
        let dislikeSimilarImages = []
        if (feedback?.like && feedback?.dislike) {
          likeSimilarImages = data.like[0].map((image: any) => image.img_link) 
          dislikeSimilarImages = data.dislike[0].map((image: any) => image.img_link)
        }
        else if (feedback?.like) {
          likeSimilarImages = data[0].map((image: any) => image.img_link)
          dislikeSimilarImages = []
        }
        else if (feedback?.dislike) {
          likeSimilarImages = []
          dislikeSimilarImages = data[0].map((image: any) => image.img_link)
        }

        const likedImages = queryData.filter((image: any) => likeSimilarImages.includes(image.img_link));
        const otherImages = queryData.filter((image: any) =>
          !likeSimilarImages.includes(image.img_link)
        );

        const tempFeedbackImage = [...likedImages, ...otherImages];

        const afterFeedbackImage = tempFeedbackImage.filter((image: any) => !dislikeSimilarImages.includes(image.img_link));
        dispatch(appActions.setAppImageData(afterFeedbackImage));

      }
      if (isError) {
        console.error('Error fetching feedback result:', error)
      }
    }
  }, [feedbackResult])


  useEffect(() => {
    const handleKeyDown = (e: any) => {
      if (e.shiftKey && e.key === 'Enter') {
        e.preventDefault(); // Ngăn chặn các hành động mặc định khác của "Enter"
        console.log('Shift + Enter pressed');
        handleSubmitFeedback(e); // Gọi hàm khi nhấn Shift + Enter
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSubmitFeedback]);

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
          >
            {likeImages.length === 0 ? (
              <Typography>No images to preview</Typography>
            ) : (
              <>
                {/* Add delete Icon here add the right corner of the row */}
                <DeleteIcon onClick={handleClearLike} style={{ right: '0', top: '0' }} />
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
                <DeleteIcon onClick={handleClearDislike} style={{ right: '0', top: '0' }} />
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
