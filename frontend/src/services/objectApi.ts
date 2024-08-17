import { createApi } from "@reduxjs/toolkit/query/react";
import { ObjPosQuery } from ".";
import type { ApiResponse, ObjPosParams, ObjPosResponse } from '../types/api';

export const ObjectPosApi = createApi({
  reducerPath: "ObjectPosApi",
  baseQuery: ObjPosQuery,
  tagTypes: ["ObjectPositioning"],
  endpoints(builder){
    return {
      getObjectsByPosition: builder.query<ObjPosResponse[], ObjPosParams[]>({
        query: (params) => {
          return {
            url: "/obj/positioning",
            method: "POST",
            body: params,
          }
        },
        transformResponse: (response: ApiResponse) => {
          return response.data;
        },
        providesTags: (result) =>
          result
            ? [
                ...result.map(({ img_link }) => ({
                  type: 'ObjectPositioning' as const,
                  id: img_link,
                })),
                { type: 'ObjectPositioning', id: 'LIST' },
              ]
            : [{ type: 'ObjectPositioning', id: 'LIST' }],
      }),
    }
  }
})

