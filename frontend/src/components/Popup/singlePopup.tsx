import './singlePopup.css'
import { type Dispatch, type SetStateAction, useEffect, useRef, useState, forwardRef, useCallback } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeGrid as Grid } from 'react-window'
import closeIcon from '../../assets/close.png'
import { AnImage, ObjectDetail } from '..'
import { appActions, useAppDispatch, useAppSelector, useGetSimilarsQuery } from '../../AppState'
import React from 'react'
import type { ImageRecord } from '../../types/image'
import { Box, Typography, IconButton, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const SinglePopup = ({ viewImage, onClose }: { viewImage: any, onClose: any }) => {
  const result = useGetSimilarsQuery([viewImage.img_link])
  const { data, error, isError, isFetching } = result;
  const SimilarData = !isFetching && !isError && data ? data : [];
  console.log('data in here', data)

  const viewImageRef = useRef(null)
  const gridRef = useRef(null)

  const dispatch = useAppDispatch()
  const setSimilarImages = useCallback((images: string[]) => {
    dispatch(appActions.setSimilarPopupData(images))
  }, [dispatch])

  const setLoadingPopup = useCallback((value: string) => {
    dispatch(appActions.setLoadingPopUp(value))
  }, [dispatch])

  const setResult = useCallback((value: ImageRecord[]) => {
    dispatch(appActions.setAppImageData(value))
  }, [dispatch])

  const setCacheResult = useCallback((value: ImageRecord[]) => {
    dispatch(appActions.setCacheData(value))
  }, [dispatch])

  useEffect(() => {
    if (isFetching) {
      setLoadingPopup('Loading Similar Images...')
    }

    if (isError) {
      console.error('Error fetching Similar Images:', error)
      setLoadingPopup('Error fetching Similar Images')
    }
    if (data && !isFetching) {
      setLoadingPopup('');
      // setsinglePopupData(data);
      // setResult(data);
      setCacheResult(data);
    }
  }, [isFetching, isError, error, data]);

  const Cell = ({ columnIndex, rowIndex, style }: { columnIndex: number, rowIndex: number, style: any }) => {
    const index = rowIndex * columnCount + columnIndex;
    const imageData = SimilarData[index];
    console.log('imageData', imageData);
    if (!imageData) return null;
    

    const { img_link, date, time } = imageData;
    const formattedTime = `${date} ${time}`;
    const isHighlighted = img_link === viewImage.img_link;

    return (
      <Box
        sx={style}
        className={`image-wrapper-neighbor ${isHighlighted ? 'highlight' : ''}`}
        ref={isHighlighted ? viewImageRef : null}
      >
        <Box className="h-full overflow-hidden p-0.5">
          <AnImage key={index} index={index} data={imageData} />
        </Box>
      </Box>
    );
  };

  const columnCount = 5; // Number of columns in the grid
  const itemSize = 180; // Size of each cell in the grid

  return (
    <Paper className="single-popup-container" elevation={3}>
      <Box className="popup-content-background row" display="flex" flexDirection="column">
        <Box className="single-images-container col" p={2}>
          <Typography variant="h4" className="py-2">Similar Images</Typography>
          <Box display="flex" height="100%">
            <Box className="left-column overflow-auto" flex={1}>
              <Box display="flex" justifyContent="center">
                <Box className="object-contain" maxHeight={420} width="auto">
                  <AnImage
                    data={viewImage}
                    isDisplayTooltip={false}
                    isZoomOnHover={false}
                  />
                </Box>
              </Box>
              <Box className="img-info row" pl={2} pt={1}>
                <ObjectDetail viewImage={viewImage} />
              </Box>
            </Box>
            <Box sx={{ width: '60%', backgroundColor: '#d0d0d0', maxHeight: '100%' }}>
              {SimilarData && SimilarData.length > 0 ? (
                <AutoSizer>
                  {({ height, width }) => {
                    const columnWidth = width / columnCount - 1.5;
                    const rowHeight = 130; // Making rows square by setting row height equal to column width
                    const rowCount = Math.ceil(SimilarData.length / columnCount);

                    return (
                      <Grid
                        columnCount={columnCount}
                        columnWidth={columnWidth}
                        height={height}
                        rowCount={rowCount}
                        rowHeight={rowHeight}
                        width={width}
                        ref={gridRef}
                      >
                        {Cell}
                      </Grid>
                    );
                  }}
                </AutoSizer>
              ) : SimilarData == null ? (
                <Typography>No Similar Images Found</Typography>
              ) : (
                <Typography>Loading Similar Images...</Typography>
              )}
            </Box>
          </Box>
        </Box>
        <Box className="close-button-container">
          <IconButton onClick={() => onClose(true)} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  )
}

export default SinglePopup
