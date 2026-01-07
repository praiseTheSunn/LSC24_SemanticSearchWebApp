import { createSlice } from '@reduxjs/toolkit'
import { defaultConfig, loadConfigFromLocalStorage } from '../components'
import type { AppState } from '../types/app'
import { set } from 'lodash'

const initialState: AppState = {
  loadingPopUpMessage: '',
  neighborPopUpData: null,
  similarPopUpData: null,
  imagePreviewData: null,
  SubmitData: null,
  isObjPosPopUpOpen: false,
  isMessagePopUpOpen: false,
  isHistoryPopUpOpen: false,

  isVietnameseEnabled: false,

  videoDataForPopup: { source: undefined, timestamp: undefined },

  data: [],
  queryPayload: {
    model: 'clips',
    mode: 'vec',
    text_query: '',
    dataset: 'aic25',
    user_id: 'xxx',
    temporal_window_size: 3,
    use_temporal_window: false,
    display_window_size: 0,
    llm_model: 'gpt-4o',
  },
  queryHistory: [],

  csvImages: [],
  trakedImages: [],
  likedImages: [],
  dislikedImages: [],
  isCsvPreviewPopupOpen: false,

  isEvaluationBoxOpen: false,

  config: loadConfigFromLocalStorage() || defaultConfig,

  isDictionaryPopupOpen: false,
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
    setTrakedImages: (state, action) => {
      state.trakedImages = action.payload
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

    setSubmitData(state, action) {
      state.SubmitData = action.payload
    },

    setLikedImages: (state, action) => {
      state.likedImages = action.payload
    },

    setDislikedImages: (state, action) => {
      state.dislikedImages = action.payload
    },

    setDictionaryPopup: (state, action) => {
      state.isDictionaryPopupOpen = action.payload
    },
  },
})
