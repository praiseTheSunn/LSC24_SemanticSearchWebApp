// const AICSubmitFunc = (evalId: number, sesId: string | null, filename: string) => {
//   const toastId = toast.loading(`Submitting: ${filename}`, { closeOnClick: true });

import type { Dispatch } from '@reduxjs/toolkit'
import { type Id, toast } from 'react-toastify'
import type { AppState, EvaluationState } from '../types/app'
import { useSelector } from 'react-redux'
import type { ImageRecord } from '../types/image'
import { appActions, useAppDispatch, useAppSelector } from '../AppState'
import type { useKISAnsweringMutation } from '../AppState'
import { useEffect } from 'react'
import { displayResponseToast } from '../utils/evaluation/displayResponseToast'

export const  AIC_addImages = async (
  src_data: ImageRecord,
  triggerKIS: ReturnType<typeof useKISAnsweringMutation>[0]
)  => {
  const evaluationId = localStorage.getItem('evaluationId')
  const sessionId = localStorage.getItem('sessionId')
  
  console.log('evaluationId here:', evaluationId);
  console.log('sessionId here:', sessionId);

  const time = Number(src_data.timestamp) * 1000
  const video = src_data.video_id

  if (!evaluationId || !sessionId || !video) {
    console.log("Missing evaluationId, sessionId or video")
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