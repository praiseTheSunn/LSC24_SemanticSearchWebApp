import {
  type BaseQueryApi,
  type BaseQueryFn,
  type FetchArgs,
  fetchBaseQuery,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
  retry,
} from '@reduxjs/toolkit/query'
import { OBJ_POS_API_URL } from '../types/constants'

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

export const query: QueryFn = fetchBaseQuery({
  baseUrl: BASE_API_URL,
  prepareHeaders,
})

export const ObjPosQuery: QueryFn = fetchBaseQuery({
  baseUrl: OBJ_POS_API_URL,
  prepareHeaders,
})

export const baseQueryWithRetry = retry(query, { maxRetries: 3 })
