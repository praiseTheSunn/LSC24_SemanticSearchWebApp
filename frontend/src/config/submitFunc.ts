// const AICSubmitFunc = (evalId: number, sesId: string | null, filename: string) => {
//   const toastId = toast.loading(`Submitting: ${filename}`, { closeOnClick: true });

import type { Dispatch } from '@reduxjs/toolkit'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { type Id, toast } from 'react-toastify'
import { appActions, useAppDispatch, useAppSelector } from '../AppState'
import type { useSubmitKISAnsweringMutation } from '../AppState'
import type { AppState } from '../types/app'
import type { ImageRecord } from '../types/image'
import { displayResponseToast } from '../utils/evaluation/displayResponseToast'


export const LSC_addCSVImages = (src: ImageRecord, toastId: Id | null ,dispatch: Dispatch, prevImages: ImageRecord[]) => {
  
  // toast.update(toastId, { render: `Added: ${src.img_link}`,type: 'success', isLoading: false, closeOnClick: true, autoClose: 200, delay: 200 });
  toast.success(`Added: ${src.img_link}`, { autoClose: 200, position: 'bottom-right' });
  
  const updatedCSVImages = [...prevImages, src].filter((value, index, self) =>
    index === self.findIndex((t) => (
      t.img_link === value.img_link
    ))
  );
  // console.log('updatedCSVImages', updatedCSVImages);
  
  dispatch(appActions.setCSVImages(updatedCSVImages));
}

export const AIC_addImages = async (
  src_data: ImageRecord,
  triggerKIS: ReturnType<typeof useSubmitKISAnsweringMutation>[0],
) => {
  const evaluationId = localStorage.getItem('evaluationId')
  const sessionId = localStorage.getItem('sessionId')

  console.log('evaluationId here:', evaluationId)
  console.log('sessionId here:', sessionId)

  const time = Number(src_data.timestamp) * 1000
  const video = src_data.video_id

  if (!evaluationId || !sessionId || !video) {
    console.log('Missing evaluationId, sessionId or video')
    return
  }

  const resultKIS = await triggerKIS({
    session: sessionId,
    evaluation_id: evaluationId,
    mediaItemName: video,
    start: time,
    end: time,
  })

  displayResponseToast(resultKIS)
}
