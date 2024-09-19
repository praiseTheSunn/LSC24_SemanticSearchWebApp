import { createSlice } from '@reduxjs/toolkit'
import type { AppState } from '../types/app'

const initialState: AppState = {
  isLoadingPopUpOpen: false,
  neighborPopUpData: null,
  similarPopUpData: null,
}

export const sliceApp = createSlice({
  name: 'sliceApp',
  initialState,
  reducers: {
    openLoadingPopUp: (state, action) => {
      state.isLoadingPopUpOpen = true

    },
    closeLoadingPopUp: (state) => {
      state.isLoadingPopUpOpen = false
    },
    openNeighborPopUp: (state, action) => {
      state.neighborPopUpData = action.payload
    },
    closeNeighborPopUp: (state) => {
      state.neighborPopUpData = null
    },
    openSimilarPopUp: (state, action) => {
      state.similarPopUpData = action.payload
    },
    closeSimilarPopUp: (state) => {
      state.similarPopUpData = null
    },
  },
})
