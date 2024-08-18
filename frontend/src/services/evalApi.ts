import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { EvalQuery } from '.'
import type { ApiResponse, EvalLoginParams } from '../types/api'

export const EvalApi = createApi({
    reducerPath: "EvalApi",
    baseQuery: EvalQuery,
    tagTypes: ["Eval"],
    endpoints(builder){
        return {
        getEval: builder.query<string, EvalLoginParams>({
            query: (params) => {
            return {
                url: "/api/v2/login",
                method: "POST",
                body: params,
            }
            },
        })
        }
    }
    })