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
  videoDataForPopup: {source: string| undefined, timestamp: string | undefined}
  data: ImageRecord[]
  cacheData: ImageRecord[]
  queryHistory: {time: string, query: string}[]
  queryPayload: QueryPayload
  csvImages: ImageRecord[]
}

export type TimelineState = {
  selectedDate: string | null
  inHoldMode: boolean
  // locationBasedData: any
  // activityBasedData: any
}

export type EvaluationState = {
  evaluationId: null | string,
  username: string,
  password: string,
}