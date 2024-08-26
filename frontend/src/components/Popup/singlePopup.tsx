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
    <Box className="single-popup-container" sx={{
      display: 'flex',
      position: 'fixed',
      top: '2.5%',
      left: '2.5%',
      height: '95%',
      width: '95%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 10000,
    }}>
      <Box className="popup-content-background" sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        position: 'relative',
      }}>
        <Typography variant="h4" className="py-2" textAlign="center" fontWeight="bold">Similar Images</Typography>
        <Box className="single-images-container" p={2} justifyContent="center">
          <Box display="flex" height="100%" width="100%">
            <Box className="left-column overflow-auto" sx={{
              flex: 1,
              flexDirection: 'column',
              backgroundColor: '#f0f0f0',
              overflowY: 'auto',
              height: 'auto',
              // Các thuộc tính bị ghi chú (commented out) có thể được thêm vào nếu cần thiết
              // gridTemplateRows: '1fr 1fr',
              // paddingBottom: '20px',
            }}>
              <Box display="flex" justifyContent="center">
                <Box className="object-contain" maxHeight={420} width="auto">
                  <AnImage
                    data={viewImage}
                    isDisplayTooltip={false}
                    isZoomOnHover={false}
                  />
                </Box>
              </Box>
              <Box className="img-info row" sx={{
                display: 'flex',
                position: 'relative',
                flex: 1,
                top: 0,
                left: 0,
                backgroundColor: '#f0f0f0',
                overflowY: 'scroll',
                // Các thuộc tính bị ghi chú có thể được thêm vào nếu cần
                // textAlign: 'center',
                // padding: '10px',
              }}
                pl={2} pt={1}>
                <ObjectDetail viewImage={viewImage} />
              </Box>
            </Box>
            <Box sx={{ width: '60%', backgroundColor: '#d0d0d0', maxHeight: '100%' }}>
              {SimilarData && SimilarData.length > 0 ? (
                <AutoSizer>
                  {({ height, width }) => {
                    const columnWidth = width / columnCount;
                    const rowHeight = 150; // Making rows square by setting row height equal to column width
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
        <Box className="close-button-container" sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '30px',
          width: '30px',
          padding: '5px',
          backgroundColor: 'white',
          position: 'absolute',
          top: '-1.7%',
          right: '-0.7%',
          borderRadius: '20px',
          cursor: 'pointer',
          zIndex: 10000,
        }}>
          <IconButton onClick={() => onClose(true)} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  )
}

export default SinglePopup
