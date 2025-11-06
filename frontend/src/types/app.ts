import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query'
import type { ImageRecord } from './image'
import type { QueryPayload } from './search'

export type QueryFn = BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  object,
  FetchBaseQueryMeta
>

export type LocalStorageAction = 'SET' | 'GET'

export type AppState = {
  loadingPopUpMessage: string
  isObjPosPopUpOpen: boolean
  isMessagePopUpOpen: boolean
  isHistoryPopUpOpen: boolean
  isVietnameseEnabled: boolean
  neighborPopUpData: ImageRecord | null | undefined
  similarPopUpData: ImageRecord | null | undefined
  imagePreviewData: ImageRecord | null | undefined
  SubmitData: ImageRecord | null | undefined
  videoDataForPopup: {
    source: string | undefined
    timestamp: string | undefined
  }
  data: ImageRecord[]
  queryHistory: { time: string; query: string }[]
  queryPayload: QueryPayload

  csvImages: ImageRecord[]
  trakedImages: ImageRecord[]
  likedImages: ImageRecord[]
  dislikedImages: ImageRecord[]
  isCsvPreviewPopupOpen: boolean
  isEvaluationBoxOpen: boolean

  config: ConfigType
  isDictionaryPopupOpen: boolean
}

export type TimelineState = {
  selectedDate: string | null
  inHoldMode: boolean
  // locationBasedData: any
  // activityBasedData: any
}
// Define the Config type
export type ConfigType = {
  gridRowGap: string

  neighborDisplaySize: number
  useTemporalWindow: boolean
  temporalWindowSize: number

  NeighborTabCellMinWidth: number
  NeighborTabRowHeight: number

  ImageGridColumnCount: number
  ImageGridCellHeight: number

  ViewMorePopupColumnCount: number
  ViewMorePopupCellHeight: number

  SinglePopupCellHeight: number
  SinglePopupColumnCount: number

  NeighborPopupCellHeight: number
  NeighborPopupColumnCount: number
  NeighborPopupSpan: number

  WhiteboardGridRowCount: number
  WhiteboardGridColumnCount: number

  WhiteboardCanvasWidth: number
  WhiteboardCanvasHeight: number

  LikeNumber: number
  DislikeNumber: number
}
