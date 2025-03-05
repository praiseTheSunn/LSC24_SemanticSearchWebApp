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
import { useLazyGetEvalIDQuery, useLazyGetSessionIDQuery } from '../AppState'
import { useCallback } from 'react'
import { set } from 'lodash'

const VBSAutoSubmit = async (
  username: string,
  password: string,
  src_data: ImageRecord,
  triggerKIS: ReturnType<typeof useSubmitKISAnsweringMutation>[0],
) => {

  const masterSessionID = localStorage.getItem('masterSessionID') ?? ''
  const masterEvaluationID = localStorage.getItem('evaluationId') ?? ''
  const time = Number(src_data.timestamp)
  const video = src_data.video_id
  const masterResponse = await triggerKIS({
    session: masterSessionID,
    evaluation_id: masterEvaluationID,
    mediaItemName: video as string,
    start: time,
    end: time,
  })

  if (masterResponse.data?.submission === 'CORRECT') {
    console.log('Master response is correct')
  } else {
    console.log('Master response is wrong', masterResponse)
  }
}

export const AIC_addImages = async (
  src_data: ImageRecord,
  triggerKIS: ReturnType<typeof useSubmitKISAnsweringMutation>[0],
) => {
  const evaluationId = localStorage.getItem('evaluationId')
  const sessionId = localStorage.getItem('sessionId')

  // const time = Number(src_data.timestamp) * 1000
  const time = Number(src_data.timestamp)
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

  const username = localStorage.getItem('username')

  if (resultKIS.data?.submission === 'CORRECT' && username !== '17snapseek1') {
    // VBSAutoSubmit('17snapseek1', 'rN7wvHEkYp9X', src_data, triggerKIS);
    // setTimeout(async () => {
    //   const masterSessionID = localStorage.getItem('masterSessionID') ?? ''
    //   const masterEvaluationID = localStorage.getItem('evaluationId') ?? ''
    //   const time = Number(src_data.timestamp)
    //   const video = src_data.video_id
    //   const masterResponse = await triggerKIS({
    //   session: masterSessionID,
    //   evaluation_id: masterEvaluationID,
    //   mediaItemName: video as string,
    //   start: time,
    //   end: time,
    //   })

    //   if (masterResponse.data?.submission === 'CORRECT') {
    //   console.log('Master response is correct')
    //   } else {
    //   console.log('Master response is wrong', masterResponse)
    //   }
    // }, 20000)
  }
}

