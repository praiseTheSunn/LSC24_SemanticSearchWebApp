import React from 'react'
import view_icon from '../assets/view_icon.png'
import { useAppDispatch, useAppSelector, appActions } from '../AppState'
import { isNil } from 'lodash'

interface AnImageProps {
  data: any
  index?: number
  isDisplayTooltip?: boolean
  isZoomOnHover?: boolean
}

const AnImage: React.FC<AnImageProps> = ({ data, index, isDisplayTooltip, isZoomOnHover }) => {
  isDisplayTooltip = isDisplayTooltip !== undefined ? isDisplayTooltip : true
  isZoomOnHover = isZoomOnHover !== undefined ? isZoomOnHover : true

  const src = data?.img_link ? data.img_link : null
  const date = data?.date ? data.date : null
  const time = data?.time ? data.time : null
  const formattedTime = `${date}  ${time}`
  const json_data = isDisplayTooltip ? JSON.stringify(data) : null

  const dispatch = useAppDispatch()
  const isNeighborPopupOpened = useAppSelector(
    (state) => state.app.neighborPopUpData,
    isNil,
  )
  const isSimilarPopupOpened = useAppSelector(
    (state) => state.app.isDrawerExpanded,
    isNil,
  )
  const toggleNeighborPopup = React.useCallback((data) => {
    if (isNeighborPopupOpened) {
      dispatch(appActions.closeNeighborPopUp(data))
    } else {
      dispatch(appActions.openNeighborPopUp(data))
    }
  }, [dispatch, isNeighborPopupOpened])
  const toggleSimilarPopup = React.useCallback((data) => {
    if (isSimilarPopupOpened) {
      dispatch(appActions.closeSimilarPopUp(data))
    } else {
      dispatch(appActions.openSimilarPopUp(data))
    }
  }, [dispatch, isSimilarPopupOpened])
  

  return (
    <div
      key={index}
      className={`an-img-container relative w-full h-full ${isZoomOnHover ? 'hover:z-50 hover:scale-105 transition-transform duration-300 ease-in-out' : ''}  overflow-hidden rounded-xl`}
      data-tooltip-id="tooltip_img"
      data-tooltip-content={json_data}
      data-tooltip-variant="dark"
      onDoubleClick={(e) => {
        e.preventDefault()
        toggleSimilarPopup(data)
        toggleNeighborPopup(null)
      }}
    >
      {isZoomOnHover && (
        <style>
          {'.an-img-container:hover .img-action-eye { display: block;}'}
          {
            '.an-img-container:hover  .image-item-img { border: 2px solid rgb(0, 47, 255); }'
          }
        </style>
      )}

      <div className="info-item text-xs text-white bg-black opacity-60 absolute top-0 left-0 py-1">
        {formattedTime}
      </div>
      <img
        src={src}
        alt={`${index}`}
        // className=' object-contain w-full max-h-[140px] cursor-pointer'
        className="  max-w-full h-full cursor-pointer mx-auto  image-item-img bg-white submissible"
        // onClick={() => setImageLink(src)}
      />
      <div
        className="bg-black opacity-50 absolute bottom-0 right-0 img-action-eye z-50 hidden"
        onClick={(e) => {
          e.preventDefault()
          toggleNeighborPopup(data)
          toggleSimilarPopup(null)
        }}
        {...spread}
      >
        <img src={view_icon} alt={`View ${index}`} className="size-7" />
      </div>
    </div>
  )
}

export default AnImage
