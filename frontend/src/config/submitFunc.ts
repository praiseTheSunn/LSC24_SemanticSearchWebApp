

// const AICSubmitFunc = (evalId: number, sesId: string | null, filename: string) => {
//   const toastId = toast.loading(`Submitting: ${filename}`, { closeOnClick: true });

import { type Id, toast } from "react-toastify";
import { appActions } from "../AppState";
import type { AppState } from "../types/app";
import type { ImageRecord } from "../types/image";
import type { Dispatch } from "@reduxjs/toolkit";


export const LSC_addCSVImages = (src: string, toastId: Id, imageDatas : ImageRecord[], dispatch: Dispatch, prevImages: ImageRecord[]) => {
  const newData = imageDatas.find((item) => item.img_link === src);
  
  if (!newData) {
    toast.update(toastId, { render: 'Error: Image not found',type: 'error', isLoading: false, closeOnClick: true, autoClose: 500, delay: 500 });
    return;
  }
  
  toast.update(toastId, { render: `Added: ${newData.img_link}`,type: 'success', isLoading: false, closeOnClick: true, autoClose: 500, delay: 500 });
  
  const updatedCSVImages = [...prevImages, newData];
  console.log('updatedCSVImages', updatedCSVImages);
  
  dispatch(appActions.setCSVImages(updatedCSVImages));
}

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