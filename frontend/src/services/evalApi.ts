import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { EvalQuery } from '.'
import type { LoginResponse, EvalLoginParams, EvalIDResponse, EvalTextParams, QAParams, KISParams } from '../types/api'
import { QuestionAnswer } from '@mui/icons-material'
import type { SubmitResponse } from '../types/submit'
import { transformResponse_Feedback_AIC } from '../config/transformResponse'


export const EvalApi = createApi({
  reducerPath: 'EvalApi',
  baseQuery: EvalQuery,
  tagTypes: ['Eval'],
  endpoints(builder) {
    return {
      getSessionID: builder.query<string, EvalLoginParams>({
        query: (params) => {
          return {
            url: '/api/v2/login',
            method: 'POST',
            body: params,
          }
        },
        transformResponse: (response: LoginResponse) => response.sessionId
      }),

      getEvalID: builder.query<string[], EvalTextParams>({
        query: (params) => {
          return {
            url: `/api/v2/client/evaluation/list?session=${params.session}`,
            method: 'GET',
          }
        },
        transformResponse: (response: EvalIDResponse[]) => {
          return response.map((item) => item.id)
        }
      }),

      QuestionAnswering: builder.mutation<SubmitResponse, QAParams>({
        query: (params) => {
          return {
            url: `api/v2/submit/${params.evaluation_id}`,
            method: 'POST',
            params: { session: params.session },
            body: {
              answerSets: [
                {
                  answers: [
                    {
                      text: params.text,
                    },
                  ],
                },
              ],
            },
          }
        }, 
      }),

      KISAnswering: builder.mutation<SubmitResponse, KISParams>({
        query: (params) => {
          return {
            url: `api/v2/submit/${params.evaluation_id}`,
            method: 'POST',
            params: { session: params.session },
            body: {
              answerSets: [
                {
                  answers: [
                    {
                      mediaItemName: params.mediaItemName,
                      start: params.start,
                      end: params.end,  
                    },
                  ],
                },
              ],
            },
          }
        }
      }),
    }
  },
})
