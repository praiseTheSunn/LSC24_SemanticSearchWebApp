import { createSlice } from '@reduxjs/toolkit'
import { set } from 'lodash'
import { defaultConfig, loadConfigFromLocalStorage } from '../components'
import type { AppState } from '../types/app'

const initialState: AppState = {
  loadingPopUpMessage: '',
  neighborPopUpData: null,
  similarPopUpData: null,
  imagePreviewData: null,
  isObjPosPopUpOpen: false,
  isMessagePopUpOpen: false,
  isHistoryPopUpOpen: false,

  isVietnameseEnabled: false,

  // videoDataForPopup: {source: "https://www.youtube.com/watch?v=spUNpyF58BY", timestamp: "0:9:38"},
  videoDataForPopup: { source: undefined, timestamp: undefined },

  data: [],
  cacheData: [],
  queryPayload: {
    model: 'clip',
    mode: 'vec',
    text_query: '',
    dataset: 'aic24',
  },
  queryHistory: [],

  csvImages: [],
  likedImages: [],
  dislikedImages: [],
  isCsvPreviewPopupOpen: false,

  isEvaluationBoxOpen: false,

  config: loadConfigFromLocalStorage() || defaultConfig,
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

    setCSVPreviewPopup: (state, action) => {
      state.isCsvPreviewPopupOpen = action.payload
    },

    setEvaluationBox: (state, action) => {
      state.isEvaluationBoxOpen = action.payload
    },

    setConfig: (state, action) => {
      state.config = action.payload
    },

    setImagePreview(state, action) {
      state.imagePreviewData = action.payload
    },

    setLikedImages: (state, action) => {
      state.likedImages = action.payload
    },

    setDislikedImages: (state, action) => {
      state.dislikedImages = action.payload
    },

  },
})
