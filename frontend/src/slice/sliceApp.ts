import { createSlice } from '@reduxjs/toolkit'
import type { AppState } from '../types/app'

const initialState: AppState = {
  isLoadingPopUpOpen: false,
  neighborPopUpData: null,
  similarPopUpData: null,
  displayedImages: [],
}

export const sliceApp = createSlice({
  name: 'sliceApp',
  initialState,
  reducers: {
    setLoadingPopUp: (state, action) => {
      state.isLoadingPopUpOpen = action.payload
    },
    setNeighborPopupData: (state, action) => {
      state.neighborPopUpData = action.payload
    },
    setSimilarPopupData: (state, action) => {
      state.similarPopUpData = action.payload
    },
    setDisplayedImages: (state, action) => {
      state.displayedImages = action.payload
    },
  },
})
