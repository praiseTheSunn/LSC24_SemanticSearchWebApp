import { createApi } from '@reduxjs/toolkit/query/react'
import { get } from 'lodash'
import { ImageQuery } from '.'
import {
  transformResponse_LSC2024,
  transformResponse_Feedback_AIC,
  transformResponse_Feedback_LSC2024,
  transformResponse_Thesis,
  transformResponse_Feedback_Thesis,
} from '../config/transformResponse'
import type {
  ApiResponse,
  ExploreNeighborParams,
  ExploreSimilarParams,
  FeedbackQueryParams,
  ImageQueryParams,
  TextQueryParams,
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
          const tempParams = {
            ...params,
            user_id: localStorage.getItem('username'),
            query_id: localStorage.getItem("currentQuestId"),
          }
          return {
            url: '/search/search_with_text_query',
            method: 'POST',
            body: tempParams,
          }
        },
        transformResponse: (response: ApiResponse) =>
          transformResponse_Thesis(response),
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
          const tempParams = {
            ...params,
            user_id: localStorage.getItem('username'),
            query_id: localStorage.getItem("currentQuestId"),
          }
          return{
            url: '/explore/explore_similar_images',
            method: 'POST',
            // body: { image_urls: urls, model: 'clip', dataset: 'aic24' },
            body: tempParams,
        }},
        transformResponse: (response: ApiResponse) =>
          transformResponse_LSC2024(response),
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
           const tempParams = {
            ...params,
            user_id: localStorage.getItem('username'),
            query_id: localStorage.getItem("currentQuestId"),
          }
          return {
            url: '/explore/explore_neighbor_images',
            method: 'POST',
            // body: { image_url: img_url, span: 30, dataset: 'aic24' },
            body: tempParams,
          }
        },
        transformResponse: (response: ApiResponse) =>
          transformResponse_LSC2024(response),
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
        query: (imageQuery) => ({
          url: '/search/search_with_image_query',
          method: 'POST',
          body: imageQuery,
        }),
        transformResponse: (response: ApiResponse) =>
          transformResponse_LSC2024(response),
        providesTags: [{ type: 'Image', id: 'LIST' }],
      }),

      getFeedbackImages: builder.query<
        any,
        FeedbackQueryParams | undefined | null
      >({
        query: (params) => {
          const tempParams = {
            ...params,
            user_id: localStorage.getItem('username'),
            query_id: localStorage.getItem("currentQuestId"),
          }
          return {
            url: '/feedback',
            method: 'POST',
            body: tempParams,
          }
        },
        transformResponse: (response: ApiResponse) =>
          transformResponse_Feedback_Thesis(response),
      }),
    }
  },
})
