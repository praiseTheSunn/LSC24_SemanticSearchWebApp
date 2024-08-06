import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query'

export type QueryFn = BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  object,
  FetchBaseQueryMeta
>

export type LocalStorageAction = 'SET' | 'GET'

export type AppState = {
  isLoadingPopUpOpen: boolean
  neighborPopUpData: any
  similarPopUpData: any
}

export type EvaluationState = {
  evaluationId: null | string,
  username: string,
  password: string,
}