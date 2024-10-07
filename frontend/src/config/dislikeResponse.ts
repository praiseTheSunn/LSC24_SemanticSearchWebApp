import type { Dispatch } from '@reduxjs/toolkit'
import { type Id, toast } from 'react-toastify'
import { appActions } from '../AppState'
import type { AppState } from '../types/app'
import type { ImageRecord } from '../types/image'

export const AddDislikeAction = (
  src_data: ImageRecord,
  toastId: Id,
  imageDatas: ImageRecord[],
  dispatch: Dispatch,
  prevImages: ImageRecord[],
) => {
  toast.update(toastId, {
    render: `Added to dislike images: ${src_data.img_link}`,
    type: 'success',
    isLoading: false,
    closeOnClick: true,
    autoClose: 500,
    delay: 500,
  })

  const updatedDislikedImages = [...prevImages, src_data]
  // console.log('updatedCSVImages', updatedCSVImages);

  dispatch(appActions.setDislikedImages(updatedDislikedImages))
}