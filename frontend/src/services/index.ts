import {
  type BaseQueryApi,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
  fetchBaseQuery,
  retry,
} from '@reduxjs/toolkit/query'
import { BASE_API_URL, EVAL_API_URL, OBJ_POS_API_URL } from '../types/constants'

export type QueryFn = BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  object,
  FetchBaseQueryMeta
>

const prepareHeaders = async (
  headers: Headers,
  api: Pick<
    BaseQueryApi,
    'getState' | 'extra' | 'endpoint' | 'type' | 'forced'
  >,
) => {
  return headers
}

export const ImageQuery: QueryFn = fetchBaseQuery({
  baseUrl: BASE_API_URL,
  prepareHeaders,
})

export const ObjPosQuery: QueryFn = fetchBaseQuery({
  baseUrl: OBJ_POS_API_URL,
  prepareHeaders,
})

export const EvalQuery: QueryFn = fetchBaseQuery({
  baseUrl: EVAL_API_URL,
  prepareHeaders,
})

export const GoogleTranslateQuery: QueryFn = fetchBaseQuery({
  baseUrl: 'https://translation.googleapis.com/',
  prepareHeaders,
})

export const OpenAiQuery: QueryFn = fetchBaseQuery({
  baseUrl: 'https://api.openai.com/',
  prepareHeaders,
})

export const baseQueryWithRetry = retry(ImageQuery, { maxRetries: 3 })
