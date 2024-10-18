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

export const LSC_addCSVImages = (
  src_data: ImageRecord,
  toastId: Id,
  imageDatas: ImageRecord[],
  dispatch: Dispatch,
  prevImages: ImageRecord[],
  evaluationId2: string | null,
  sessionId2: string | null,
  triggerKIS: ReturnType<typeof useKISAnsweringMutation>[0]
) => {
  const evaluationId = localStorage.getItem('evaluationId')
  const sessionId = localStorage.getItem('sessionId')
  
  console.log('evaluationId here:', evaluationId);
  console.log('sessionId here:', sessionId);

  const time = Number(src_data.timestamp) * 1000
  const video = src_data.video_id

  if (evaluationId && sessionId && video) {
    triggerKIS({
      session: sessionId,
      evaluation_id: evaluationId,
      mediaItemName: video,
      start: time,
      end: time,
    })

    toast.update(toastId, {
      render: `Submitted: ${video} at ${time}`,
      type: 'success',
      isLoading: false,
      closeOnClick: true,
      autoClose: 500,
      delay: 500,
    })
  }else{
    console.log('evaluationId or sessionId or video is null');
  }
}

// export type KISParams = {
//   session: string
//   evaluation_id: string
//   mediaItemName: string
//   start: number
//   end: number
// }

//   evalService
//     .submitFile(evalId, sesId, filename)
//     .then((response: ApiResponse) => {
//       console.log('response', response);
//       toast.update(toastId, { render: `Submit: ${filename} ${response.data.submission ? response.data.submission : ''}` });
//       if (response?.data?.submission && response?.data?.submission === 'CORRECT') {
//         evalService
//           .submitFile(evalId, localStorage.getItem('sessionCentral'), filename)
//           .then((response: ApiResponse) => {
//             console.log('response', response);
//             toast.update(toastId, { render: `Submit FOR CENTRAL: ${filename} ${response.data.submission ? response.data.submission : ''}` });
//           })
//           .catch((error: ApiError) => {
//             console.log('error', error);
//             toast.update(toastId, { render: `ERROR FOR CENTRAL: ${filename}: ${error}` });
//           });
//       }
//     })
//     .catch((error: ApiError) => {
//       console.log('error', error);
//       toast.update(toastId, { render: `ERROR: ${filename}: ${error}` });
//     });
// };
