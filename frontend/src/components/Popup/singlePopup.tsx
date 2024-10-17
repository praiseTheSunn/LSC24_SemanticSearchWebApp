import { Box, Typography } from '@mui/material'
import { useCallback, useEffect } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeGrid as Grid } from 'react-window'
import { AnImage, ObjectDetail } from '..'
import {
  appActions,
  useAppDispatch,
  useAppSelector,
  useGetSimilarsQuery,
} from '../../AppState'
import closeIcon from '../../assets/close.png'

const SinglePopup = ({
  onClose,
  cellHeight,
}: { onClose: any; cellHeight?: number }) => {
  const Config = useAppSelector((state) => state.app.config)
  const queryPayload = useAppSelector((state) => state.app.queryPayload)

  cellHeight = cellHeight ? cellHeight : Config.SinglePopupCellHeight
  const viewImage = useAppSelector((state) => state.app.similarPopUpData)
  const exploreSimilarParams = {
    image_urls: viewImage ? [viewImage?.img_link] : undefined,
    model: queryPayload.model,
    dataset: queryPayload.dataset,
  }
  const result = useGetSimilarsQuery(exploreSimilarParams)
  const { data, error, isError, isFetching } = result

  const dispatch = useAppDispatch()

  const setLoadingPopup = useCallback(
    (value: string) => {
      dispatch(appActions.setLoadingPopUp(value))
    },
    [dispatch],
  )

  useEffect(() => {
    if (isFetching) {
      setLoadingPopup('Loading Similar Images...')
    }

    if (isError) {
      console.error('Error fetching Similar Images:', error)
      setLoadingPopup('Error fetching Similar Images')
    }
    if (data && !isFetching) {
      setLoadingPopup('')
      // setsinglePopupData(data);
      // setResult(data);
    }
  }, [isFetching, isError, error, data])

  const Cell = ({
    columnIndex,
    rowIndex,
    style,
  }: { columnIndex: number; rowIndex: number; style: any }) => {
    const index = rowIndex * columnCount + columnIndex
    if (data == null || index >= data.length) return null
    const imageData = data[index]
    if (!imageData) return null

    const { img_link, date, time } = imageData
    const formattedTime = `${date} ${time}`
    const isHighlighted = img_link === viewImage?.img_link

    return (
      <div
        style={{
          ...style,
          border: isHighlighted ? '2px solid #FFD700' : 'none',
          boxShadow: isHighlighted ? '0 0 10px #FFD700' : 'none',
        }}
      >
        <Box
          sx={{
            height: `calc(${style.height}px - 2 * ${Config.gridRowGap})`,
            position: 'relative',
            overflow: 'hidden',
            padding: Config.gridRowGap,
          }}
        >
          <AnImage key={index} data={imageData} index={index} />
        </Box>
      </div>
    )
  }

  const columnCount = Config.SinglePopupColumnCount // Number of columns in the grid

  return (
    <Box
      className="single-popup-container"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10000,
      }}
    >
      <Box
        className="popup-content-background"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '95%',
          height: '97%',
          backgroundColor: 'white',
          borderRadius: '20px',
          position: 'relative',
          top: '7px',
        }}
      >
        <Typography variant="h6" textAlign="center" fontWeight="bold">
          Similar Images
        </Typography>
        <Box className="single-images-container" height="90%" width="100%">
          <Box display="flex" width="100%" height="100%">
            <Box
              className="left-column"
              sx={{
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
                backgroundColor: '#f0f0f0',
                // Các thuộc tính bị ghi chú (commented out) có thể được thêm vào nếu cần thiết
                // gridTemplateRows: '1fr 1fr',
                // paddingBottom: '20px',
              }}
            >
              <Box display="flex" justifyContent="center">
                <Box className="object-contain" maxHeight={390} width="auto">
                  <AnImage
                    data={viewImage}
                    isDisplayTooltip={false}
                    isZoomOnHover={false}
                  />
                </Box>
              </Box>
              <Box
                className="img-info row"
                sx={{
                  display: 'flex',
                  position: 'relative',
                  flex: 1,
                  top: 0,
                  left: 0,
                  paddingTop: '3px',
                  backgroundColor: '#f0f0f0',
                  overflowY: 'scroll',
                  // Các thuộc tính bị ghi chú có thể được thêm vào nếu cần
                  // textAlign: 'center',
                  // padding: '10px',
                }}
                pl={2}
              >
                <ObjectDetail viewImage={viewImage} />
              </Box>
            </Box>
            <Box sx={{ width: '60%', backgroundColor: '#d0d0d0' }}>
              {data && data.length > 0 ? (
                <AutoSizer>
                  {({ height, width }) => {
                    const columnWidth = width / columnCount - 1.5
                    const rowHeight = cellHeight + 2
                    const rowCount = Math.floor(data.length / columnCount)

                    return (
                      <Grid
                        columnCount={columnCount}
                        columnWidth={columnWidth}
                        height={height}
                        rowCount={rowCount}
                        rowHeight={rowHeight}
                        width={width}
                        overscanRowCount={8}
                      >
                        {Cell}
                      </Grid>
                    )
                  }}
                </AutoSizer>
              ) : data == null ? (
                <Typography>No Similar Images Found</Typography>
              ) : (
                <Typography>Loading Similar Images...</Typography>
              )}
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
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
          }}
        >
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
          <img
            src={closeIcon}
            // className="close-popup-button"
            style={{
              cursor: 'pointer',
              position: 'relative',
              height: '100%',
              width: '100%',
              zIndex: 1000,
            }}
            alt="close button"
            onClick={() => onClose(true)}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default SinglePopup
