import { Box, Button } from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeGrid as Grid } from 'react-window'
import { AnImage } from '..'
import { useAppSelector, useLazyGetNeighborsQuery, useAppDispatch } from '../../AppState'
import closeIcon from '../../assets/close.png'
import type { ImageRecord } from '../../types/image'
import { Padding } from '@mui/icons-material'
import { useSubmitQuestionAnsweringMutation } from '../../AppState'
import { toast } from 'react-toastify'
import { displayResponseToast } from '../../utils/evaluation/displayResponseToast'


// Define the types for props
interface NeighborPopupProps {
  onClose: (shouldClose: boolean) => void
  cellHeight?: number
  cell?: React.FC<any>
}

const NeighborPopup: React.FC<NeighborPopupProps> = ({
  onClose,
  cellHeight,
  cell,
}) => {
  const [triggerGetNeighbors, { data, isError, isFetching }] =
    useLazyGetNeighborsQuery()
  const [neighborsData, setNeighborsData] = useState<ImageRecord[]>([])
  const previousScrollTop = useRef(0)
  const viewImageRef = useRef<HTMLDivElement | null>(null)
  const viewImage = useAppSelector(
    (state) => state.app.neighborPopUpData?.img_link,
  )
  const Config = useAppSelector((state) => state.app.config)
  const queryPayload = useAppSelector((state) => state.app.queryPayload)

  const fetchNeighbors = useCallback(
    async (imageId: string, position: 'start' | 'end') => {
      try {
        const exploreParams = {
          image_url: imageId.replace("http://127.0.0.1:8080/", "").replace(".jpg", ""),
          span: Config.NeighborPopupSpan,
          dataset: queryPayload.dataset,
        }
        const response = await triggerGetNeighbors(exploreParams).unwrap()
        const newNeighbors: ImageRecord[] = response
        // console.log('newNeighbors:', newNeighbors);
        const middleIndex = Math.floor(newNeighbors.length / 2)
        const frontNeighbors = newNeighbors.slice(0, middleIndex)
        const backNeighbors = newNeighbors.slice(middleIndex)

        setNeighborsData((prev) => {
          if (imageId === viewImage) return newNeighbors
          if (position === 'start') {
            return [...frontNeighbors, ...prev]
          }
          return [...prev, ...backNeighbors]
        })
      } catch (error) {
        console.error('Error fetching neighbors:', error)
      }
    },
    [triggerGetNeighbors],
  )

  useEffect(() => {
    if (viewImage) {
      fetchNeighbors(viewImage, 'end')
    }
  }, [viewImage, fetchNeighbors])

  useEffect(() => {
    if (viewImageRef.current) {
      viewImageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [neighborsData, viewImage])

  const handleScroll = ({ scrollTop }: { scrollTop: number }) => {
    const scrollDirection =
      scrollTop < previousScrollTop.current ? 'backward' : 'forward'
    previousScrollTop.current = scrollTop

    if (scrollDirection === 'backward' && scrollTop === 0 && !isFetching) {
      const firstImage = neighborsData[0]?.img_link
      if (firstImage) {
        fetchNeighbors(firstImage, 'start')
      }
    }

    if (scrollDirection === 'forward' && !isFetching) {
      const lastImage = neighborsData[neighborsData.length - 1]?.img_link
      if (lastImage) {
        fetchNeighbors(lastImage, 'end')
      }
    }
  }

  const columnCount: number = Config.NeighborPopupColumnCount
  cellHeight = cellHeight ? cellHeight : Config.NeighborPopupCellHeight

  const Cell: React.FC<{
    columnIndex: number
    rowIndex: number
    style: React.CSSProperties
  }> = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex
    if (index >= neighborsData.length) return null

    const data = neighborsData[index]
    const { img_link } = data
    const isHighlighted = img_link === viewImage

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
          <AnImage key={index} data={data} index={index} />
        </Box>
      </div>
    )
  }

  const closePopup = () => {
    onClose(true)
  }

  const trakeData = useAppSelector((state) => state.app.trakedImages)
  const hasTrake = trakeData && trakeData.length > 0
  
    const evaluationId = localStorage.getItem('evaluationId')
    const sessionId = localStorage.getItem('sessionId')
  
    const [triggerQA, resultQA] = useSubmitQuestionAnsweringMutation()
  
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit()
      }
    }
  
    const handleSubmit = async () => {
      const text = `TR-${trakeData[0]?.video_id}-${trakeData.map(item => item.image_id?.split('/').pop()).join(',')}`
      console.log('Submitted TR:', text)
  
      if (!evaluationId || !sessionId) {
        toast.error('No EvaluationID or SessionID or Answer is null', {
          position: 'bottom-right',
          autoClose: 5000,
          closeOnClick: true,
        })
        return
      }
  
      const resultQA = await triggerQA({
        evaluation_id: evaluationId,
        session: sessionId,
        text: text,
      })
      displayResponseToast(resultQA)
    }
  
    // const dispatch = useAppDispatch()

  return (
    <Box
      style={{
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
      {/* <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          width: '95%',
          height: '95%',
          backgroundColor: 'white',
          borderRadius: '20px',
          position: 'relative',
          top: '10px',
        }}
      > */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '95%',
          height: hasTrake ? '80%' : '95%',  // ⬅ Shorten when trake exists
          backgroundColor: 'white',
          borderRadius: '20px',
          position: 'relative',
          top: '10px',
          // overflow: 'hidden',
        }}
      >
        <Box sx={{ flexDirection: 'column', flex: 1 }} ref={viewImageRef}>
          {/* <Box sx={{ flex: 1, overflow: 'hidden' }} ref={viewImageRef}> */}
          <h2
            style={{
              paddingTop: '0.1rem',
              paddingBottom: '0.1rem',
              textAlign: 'center',
            }}
          >
            Neighbor Images
          </h2>
          <Box
            sx={{
              display: 'flex',
              height: '85%',
            }}
          >
            <Box sx={{ width: '95vw' }}>
              <AutoSizer>
                {({ height, width }) => {
                  const columnWidth = width / columnCount - 1.5
                  const rowHeight = cellHeight + 2
                  const rowCount = Math.ceil(neighborsData.length / columnCount)

                  // console.log('height:', height, 'width:', width, 'columnWidth:', columnWidth, 'rowHeight:', rowHeight, 'rowCount:', rowCount);
                  return (
                    <Grid
                      columnCount={columnCount}
                      columnWidth={columnWidth}
                      height={height}
                      rowCount={rowCount}
                      rowHeight={rowHeight}
                      width={width}
                      overscanRowCount={5}
                      onScroll={({ scrollTop }) => handleScroll({ scrollTop })}
                    // style={{ gap: `${columnGap}px` }}
                    >
                      {Cell}
                    </Grid>
                  )
                }}
              </AutoSizer>
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
            onClick={closePopup}
          />
        </Box>
      </Box>
      {hasTrake && (
        <Box
          sx={{
            width: '95%',
            height: '15%',
            borderTop: '2px solid #ccc',
            overflowX: 'auto',
            display: 'flex',
            alignItems: 'center',
            paddingTop: '20px',
            gap: '8px',
            backgroundColor: 'white',
            borderRadius: '20px',
            top: '10px',
          }}
        >
          {/* ✅ Thumbnails section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flex: 1,                  // Take available space & push button right
              gap: '8px',
              overflowX: 'auto',
            }}
          >
            {trakeData.map((item, index) => (
              <Box
                key={index}
                sx={{
                  width: '10%',
                  height: '100%',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid #ddd',
                  flexShrink: 0,
                }}
              >
                <AnImage data={item} index={index} />
              </Box>
            ))}
          </Box>
          
          <Button
            variant="contained"
            sx={buttonStyles}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </Box>
      )}
    </Box>
  )
}

const buttonStyles = {
  padding: '10px',
  fontSize: '16px',
  backgroundColor: '#007bff',
  color: 'white',
}

export default NeighborPopup