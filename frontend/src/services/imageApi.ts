import { createApi } from '@reduxjs/toolkit/query/react'
import { ImageQuery } from '.'
import {
  transformResponse_Feedback_AIC2025,
  transformResponse_AIC2025,
  transformResponse_LSC,
  transformResponseByDataset,
  getTransformFeedbackFunction,
} from '../config/transformResponse'
import type {
  ApiResponse,
  ExploreNeighborParams,
  ExploreSimilarParams,
  ImageQueryParams,
  TextQueryParams,
  FeedbackQueryParams,
  FeedbackResponse
} from '../types/api'
import type { ImageRecord } from '../types/image'

export const ImageApi = createApi({
  reducerPath: 'ImageApi',
  baseQuery: ImageQuery,
  tagTypes: ['Image'],
  endpoints(builder) {
    return {
      getImages: builder.query<ImageRecord[], TextQueryParams>({
        query: (params) => {
          const tempParams = { ...params, user_id: localStorage.getItem('username') }
          return {
            url: '/search/search_with_text_query',
            method: 'POST',
            body: tempParams,
          }
        },
        transformResponse: (response: ApiResponse, meta, arg) =>
          transformResponseByDataset(arg.dataset, response),
        providesTags: (result) =>
          result
            ? [
                ...result.map(({ img_link }) => ({
                  type: 'Image' as const,
                  id: img_link,
                })),
                { type: 'Image', id: 'LIST' },
              ]
            : [{ type: 'Image', id: 'LIST' }],
      }),
      getSimilars: builder.query<ImageRecord[], ExploreSimilarParams>({
        query: (params) => {
          const tempParams = { ...params, user_id: localStorage.getItem('username') }
          return{
          url: '/explore/explore_similar_images',
          method: 'POST',
          body: tempParams,
        }},
        transformResponse: (response: ApiResponse, meta, arg) =>
          transformResponseByDataset(arg.dataset, response),
        providesTags: (result) =>
          result
            ? [
                ...result.map(({ img_link }) => ({
                  type: 'Image' as const,
                  id: img_link,
                })),
                { type: 'Image', id: 'SIMILAR_IMAGES' },
              ]
            : [{ type: 'Image', id: 'SIMILAR_IMAGES' }],
      }),

      getNeighbors: builder.query<ImageRecord[], ExploreNeighborParams>({
        query: (params) => {
          const tempParams = { ...params, user_id: localStorage.getItem('username') }
          return{
          url: '/explore/explore_neighbor_images',
          method: 'POST',
          body: tempParams,
        }},
        transformResponse: (response: ApiResponse, meta, arg) =>
          transformResponseByDataset(arg.dataset, response),
        providesTags: (result) =>
          result
            ? [
                ...result.map(({ img_link }) => ({
                  type: 'Image' as const,
                  id: img_link,
                })),
                { type: 'Image', id: 'NEIGHBORS' },
              ]
            : [{ type: 'Image', id: 'NEIGHBORS' }],
      }),

      searchByImage: builder.query<ImageRecord[], ImageQueryParams>({
        query: (imageQuery) => {
          const tempParams = { ...imageQuery, user_id: localStorage.getItem('username') }
          return {
          url: '/search/search_with_image_query',
          method: 'POST',
          body: tempParams,
        }},
        transformResponse: (response: ApiResponse, meta, arg) =>
          transformResponseByDataset(arg.dataset, response),
        providesTags: [{ type: 'Image', id: 'LIST' }],
      }),

      getFeedbackImages: builder.query<
        any,
        FeedbackQueryParams | undefined | null
      >({
        query: (params) => {
          const tempParams = { ...params, user_id: localStorage.getItem('username') }
          return {
            url: '/feedback',
            method: 'POST',
            body: tempParams,
          }
        },
        transformResponse: (response: FeedbackResponse, meta, arg) => {
          const transformFunc = getTransformFeedbackFunction(arg?.dataset)
          return transformFunc(response)
        },
      }),
    }
  },
})
