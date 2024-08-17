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
  neighborPopUpData: ImageRecord | null | undefined
  similarPopUpData: ImageRecord | null | undefined
  displayedImages: string[]
  data: ImageRecord[]
  cacheData: ImageRecord[]
  queryPayload: QueryPayload
}

export type EvaluationState = {
  evaluationId: null | string,
  username: string,
  password: string,
}