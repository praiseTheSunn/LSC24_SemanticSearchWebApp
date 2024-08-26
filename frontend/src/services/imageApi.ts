import { createApi } from "@reduxjs/toolkit/query/react";
import { ImageQuery } from ".";
import type { ImageRecord } from "../types/image";
import type { ApiResponse, QueryParams } from "../types/api";

export const ImageApi = createApi({
  reducerPath: "ImageApi",
  baseQuery: ImageQuery,
  tagTypes: ["Image"],
  endpoints(builder){
    return {
      getImages: builder.query<ImageRecord[], QueryParams>({
        query: (params) => {
          return {
            url: "/search/search_with_text_query",
            method: "POST",
            body: params,
          }
        },
        transformResponse: (response: ApiResponse) => {
          // console.log('Response:', response);
          if (response.response) {
            return response.response;
          }
          
          return response.data;
        },
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
          method: "POST",
          body: { image_urls: urls, model: 'clip' },
        }),
        transformResponse: (response: ApiResponse) => {
          // console.log('Response:', response);
          if (response.response) {
            return response.response;
          }
          
          return response.data;
        },
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
          method: "POST",
          body: { image_url: img_url, span: 30 },
        }),
        transformResponse: (response: ApiResponse) => {
          // console.log('Response:', response);
          if (response.response) {
            return response.response;
          }
          
          return response.data;
        },
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

    }
  }
})

