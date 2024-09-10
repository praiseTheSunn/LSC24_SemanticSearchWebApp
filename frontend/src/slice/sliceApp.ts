import { createSlice } from '@reduxjs/toolkit'
import type { AppState } from '../types/app'

const initialState: AppState = {
  loadingPopUpMessage: '',
  neighborPopUpData: null,
  similarPopUpData: null,
  isObjPosPopUpOpen: false,
  isMessagePopUpOpen: false,
  isHistoryPopUpOpen: false,

  isVietnameseEnabled: false,

  // videoDataForPopup: {source: "https://www.youtube.com/watch?v=spUNpyF58BY", timestamp: "0:9:38"},
  videoDataForPopup: {source: undefined, timestamp: undefined},

  data: [],
  cacheData: [],
  queryPayload: {model: 'clip', mode: 'smt', text_query: ''},
  queryHistory: [],

  csvImages: [],
  csvPreviewPopupOpen: false,
}

export const sliceApp = createSlice({
  name: 'sliceApp',
  initialState,
  reducers: {
    setLoadingPopUp: (state, action) => {
      state.loadingPopUpMessage = action.payload
    },
    setNeighborPopupData: (state, action) => {
      state.neighborPopUpData = action.payload
    },
    setSimilarPopupData: (state, action) => {
      state.similarPopUpData = action.payload
    },
    setAppImageData: (state, action) => {
      state.data = action.payload
    },
    setQueryPayload: (state, action) => {
      state.queryPayload = action.payload
    },
    setCacheData: (state, action) => {
      state.cacheData = action.payload
    },
    setObjPosPopUp: (state, action) => {
      state.isObjPosPopUpOpen = action.payload
    },
    setMessagePopUp: (state, action) => {
      state.isMessagePopUpOpen = action.payload
    },
    setQueryHistory: (state, action) => {
      if (action.payload === null) {
        state.queryHistory = []
        return
      }
      state.queryHistory.push(action.payload)
    },
    toggleHistoryPopUp: (state, action) => {
      state.isHistoryPopUpOpen = action.payload
    },
    setVideoDataForPopup: (state, action) => {
      state.videoDataForPopup = action.payload
    },
    toggleVietnamese: (state) => {
      state.isVietnameseEnabled = !state.isVietnameseEnabled
    },
    setCSVImages: (state, action) => {
      state.csvImages = action.payload
    },

    toggleCSVPreviewPopup: (state) => {
      state.csvPreviewPopupOpen = !state.csvPreviewPopupOpen
    },
  },
})
