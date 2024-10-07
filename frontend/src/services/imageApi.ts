import { createApi } from '@reduxjs/toolkit/query/react'
import { ImageQuery } from '.'
import { transformResponse_AIC2024 } from '../config/transformResponse'
import type {
  ApiResponse,
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
          return {
            url: '/search/search_with_text_query',
            method: 'POST',
            body: params,
          }
        },
        transformResponse: (response: ApiResponse) =>
          transformResponse_AIC2024(response),
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
      getSimilars: builder.query<ImageRecord[], string[] | undefined | null>({
        query: (urls) => ({
          url: '/explore/explore_similar_images',
          method: 'POST',
          body: { image_urls: urls, model: 'clip' },
        }),
        transformResponse: (response: ApiResponse) =>
          transformResponse_AIC2024(response),
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

      getNeighbors: builder.query<ImageRecord[], string>({
        query: (img_url) => ({
          url: '/explore/explore_neighbor_images',
          method: 'POST',
          body: { image_url: img_url, span: 30 },
        }),
        transformResponse: (response: ApiResponse) =>
          transformResponse_AIC2024(response),
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
          transformResponse_AIC2024(response),
        providesTags: [{ type: 'Image', id: 'LIST' }],
      }),

      getLikeSimilarImages: builder.query<ImageRecord[], string[] | undefined | null>({
        query: (urls) => ({
          url: '/explore/explore_like_similar_images',
          method: 'POST',
          body: { image_urls: urls, model: 'clip' },
        }),
        transformResponse: (response: ApiResponse) =>
          transformResponse_AIC2024(response),
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

      getDislikeSimilarImages: builder.query<ImageRecord[], string[] | undefined | null>({
        query: (urls) => ({
          url: '/explore/explore_dislike_similar_images',
          method: 'POST',
          body: { image_urls: urls, model: 'clip' },
        }),
        transformResponse: (response: ApiResponse) =>
          transformResponse_AIC2024(response),
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
    }
  },
})
