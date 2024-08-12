import './singlePopup.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeGrid as Grid } from 'react-window'
import closeIcon from '../../assets/close.png'
import { AnImage, ObjectDetail } from '..'
import imageService from '../../services/imageService'
import React from 'react'

const SinglePopup = ({ viewImage, onClose } : {viewImage: any, onClose: any}) => {
  const [singlePopupData, setsinglePopupData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const viewImageRef = useRef(null)
  const gridRef = useRef(null)

  const fetchSimilars = useCallback(async (imageId: number) => {
    setIsLoading(true)
    try {
      const response = await imageService.getSimilarImages2Image(imageId)
      const newNeighbors = response.data.response
      setsinglePopupData(newNeighbors)
      return newNeighbors
    } catch (error) {
      console.error('Error fetching Similar Images:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const imageList = [viewImage.img_link]
    fetchSimilars(imageList)
  }, [viewImage, fetchSimilars])

  const Cell = ({ columnIndex, rowIndex, style } : {columnIndex: number, rowIndex:number, style: any}) => {
    const index = rowIndex * columnCount + columnIndex
    const data = singlePopupData[index]
    if (!data) return null

    const { img_link, date, time } = data
    const formattedTime = `${date} ${time}`
    const isHighlighted = img_link === viewImage.img_link

    return (
      <div
        style={style}
        className={`image-wrapper-neighbor ${isHighlighted ? 'highlight' : ''}`}
        ref={isHighlighted ? viewImageRef : null}
      >
        <div className="h-full overflow-hidden p-0.5">
          <AnImage key={index} index={index} data={data} />
        </div>
      </div>
    )
  }

  const columnCount = 5 // Number of columns in the grid
  const itemSize = 180 // Size of each cell in the grid

  return (
    <div className="single-popup-container">
      <div className="popup-content-background row">
        <div className="single-images-container col">
          <h1 className="py-2">Similar Images</h1>
          {/* <br /> */}
          <div className="flex h-full">
            <div className="left-column overflow-auto">
              <div className="flex justify-center">
                <div className="object-contain max-h-[420px] w-auto">
                  <AnImage
                    data={viewImage}
                    isDisplayTooltip={false}
                    isZoomOnHover={false}
                  />
                </div>
              </div>
              <div className="img-info row pl-10 pt-2">
                <ObjectDetail viewImage={viewImage} />
              </div>
            </div>
            <div className="w-[60%] bg-[#d0d0d0] max-h-full">
              {singlePopupData && singlePopupData.length > 0 ? (
                <AutoSizer>
                  {({ height, width }) => {
                    const columnWidth = width / columnCount - 1.5
                    const rowHeight = 130 // Making rows square by setting row height equal to column width
                    const rowCount = Math.ceil(
                      singlePopupData.length / columnCount,
                    )

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
                    )
                  }}
                </AutoSizer>
              ) : singlePopupData == null ? (
                <div>No Similar Images Found</div>
              ) : (
                <div>Loading Similar Images...</div>
              )}
              {/* <div>Loading Similar Images...</div> */}
            </div>
          </div>
        </div>

        <div className="close-button-container">
          <img
            src={closeIcon}
            className="close-popup-button"
            alt="close button"
            onClick={() => onClose(true)}
          />
        </div>
      </div>
    </div>
  )
}

export default SinglePopup
