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

    console.log('KIS result:', resultKIS); // In ra response khi có dữ liệu

    if (resultKIS.error) {
      // console.error('Error from KIS:', resultKIS.error); // In ra lỗi nếu có
      console.log("HIHI")
      toast.error(`Submission FAILED - ERROR ${resultKIS.error.data.description}`, {
        position: 'bottom-right',
        autoClose: 2000,
      })
    }

    if (resultKIS.data) {
      console.log('KIS result:', resultKIS.data); // In ra response khi có dữ liệu
      if (resultKIS.data.status === true && resultKIS.data.submission === "CORRECT") {
        toast.success('Submission CORRECT', {
          position: 'bottom-right',
          autoClose: 2000,
        })
      }
      else if (resultKIS.data.status === true && resultKIS.data.submission === "WRONG") {
        toast.error(`Submission WRONG ${resultKIS.data.description}`, {
          position: 'bottom-right',
          autoClose: 2000,
        })
      }
      else {
        toast.error(`Submission FAILED ${resultKIS.data.description}`, {
          position: 'bottom-right',
          autoClose: 2000,
        })
      }
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
