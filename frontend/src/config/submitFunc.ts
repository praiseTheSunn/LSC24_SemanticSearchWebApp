import type { Dispatch } from '@reduxjs/toolkit'
import { appActions, type useSubmitKISAnsweringMutation } from '../AppState'
import type { AppState } from '../types/app'
import type { ImageRecord } from '../types/image'
import { displayResponseToast } from '../utils/evaluation/displayResponseToast'
import { toast } from 'react-toastify'
import { convertTimeToMs } from './transformResponse'
import type { Id } from 'react-toastify'

// const VBSAutoSubmit = async (
//   username: string,
//   password: string,
//   src_data: ImageRecord,
//   triggerKIS: ReturnType<typeof useSubmitKISAnsweringMutation>[0],
// ) => {

//   const masterSessionID = localStorage.getItem('masterSessionID') ?? ''
//   const masterEvaluationID = localStorage.getItem('evaluationId') ?? ''
//   const time = Number(src_data.timestamp)
//   const video = src_data.video_id
//   const masterResponse = await triggerKIS({
//     session: masterSessionID,
//     evaluation_id: masterEvaluationID,
//     mediaItemName: video as string,
//     start: time,
//     end: time,
//   })

//   if (masterResponse.data?.submission === 'CORRECT') {
//     console.log('Master response is correct')
//   } else {
//     console.log('Master response is wrong', masterResponse)
//   }
// }


// export const LSC_addCSVImages = (src: ImageRecord, toastId: string | null ,dispatch: Dispatch, prevImages: ImageRecord[]) => {
  
//   // toast.update(toastId, { render: `Added: ${src.img_link}`,type: 'success', isLoading: false, closeOnClick: true, autoClose: 200, delay: 200 });
//   toast.success(`Added: ${src.img_link}`, { autoClose: 200, position: 'bottom-right' });
  
//   const updatedCSVImages = [...prevImages, src].filter((value, index, self) =>
//     index === self.findIndex((t) => (
//       t.img_link === value.img_link
//     ))
//   );
//   // console.log('updatedCSVImages', updatedCSVImages);
  
//   dispatch(appActions.setCSVImages(updatedCSVImages));
// }


export const VBS_addImages = async (
  src_data: ImageRecord,
  triggerKIS: ReturnType<typeof useSubmitKISAnsweringMutation>[0],
) => {
  const evaluationId = localStorage.getItem('evaluationId')
  const sessionId = localStorage.getItem('sessionId')

  const video = src_data.video_id
  if (!evaluationId || !sessionId || !video) {
    alert('Missing evaluationId, sessionId or video')
    return
  }

  const pad5 = (s: string) => ("00000" + s).slice(-5)
  const videoStr = String(video)
  const mediaItemName = /^\d+$/.test(videoStr) ? pad5(videoStr) : videoStr
  
  const parts = src_data.img_link.split('/')
  const time_str = parts[parts.length - 1].split('.')[0] || ''
  const time = Number(time_str)

  // mediaItemName: video as string (with :05d padding if it's a number) else just string
  console.log('mediaItemName:', mediaItemName)
  console.log('time:', time)

  const resultKIS = await triggerKIS({
    session: sessionId,
    evaluation_id: evaluationId,
    mediaItemName: mediaItemName,
    start: time,
    end: time,
  })

  displayResponseToast(resultKIS)
}


export const AIC_addImages = async (
  src_data: ImageRecord,
  triggerKIS: ReturnType<typeof useSubmitKISAnsweringMutation>[0],
) => {
  const evaluationId = localStorage.getItem('evaluationId')
  const sessionId = localStorage.getItem('sessionId')

  const video = src_data.video_id
  console.log('AIC_addImages video:', video)

  if (!evaluationId || !sessionId || !video) {
    alert('Missing evaluationId, sessionId or video')
    return
  }

  const pad5 = (s: string) => ("00000" + s).slice(-5)
  const videoStr = String(video)
  const mediaItemName = /^\d+$/.test(videoStr) ? pad5(videoStr) : videoStr
  
  const parts = src_data.img_link.split('/')
  const time_str = parts[parts.length - 1].split('.')[0] || ''
  const time = Number(time_str)

  // mediaItemName: video as string (with :05d padding if it's a number) else just string
  console.log('mediaItemName:', mediaItemName)
  console.log('time:', time)

  const resultKIS = await triggerKIS({
    session: sessionId,
    evaluation_id: evaluationId,
    mediaItemName: mediaItemName,
    start: time,
    end: time,
  })

  displayResponseToast(resultKIS)
}


export const AIC_addCSVImages = (src: ImageRecord, toastId: string | null ,dispatch: Dispatch, prevImages: ImageRecord[]) => {
  
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

export const AIC_addTrakeImages = (src: ImageRecord, toastId: string | null ,dispatch: Dispatch, prevImages: ImageRecord[]) => {
  
  // toast.update(toastId, { render: `Added: ${src.img_link}`,type: 'success', isLoading: false, closeOnClick: true, autoClose: 200, delay: 200 });
  toast.success(`Added: ${src.img_link}`, { autoClose: 200, position: 'bottom-right' });

  const updatedTrakeImages = [...prevImages, src].filter((value, index, self) =>
    index === self.findIndex((t) => (
      t.img_link === value.img_link
    ))
  );
  // console.log('updatedTrakeImages', updatedTrakeImages);
  dispatch(appActions.setTrakedImages(updatedTrakeImages));
  console.log('updatedTrakeImages', updatedTrakeImages);
}