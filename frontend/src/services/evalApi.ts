import { QuestionAnswer } from '@mui/icons-material'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { EvalQuery } from '.'
import type {
  EvalIDResponse,
  EvalLoginParams,
  EvalTextParams,
  KISParams,
  LoginResponse,
  QAParams,
} from '../types/api'
import type { SubmitResponse } from '../types/submit'
import { eval_http } from './eval-common'

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
        transformResponse: (response: LoginResponse) => response.sessionId,
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
        },
      }),

      submitQuestionAnswering: builder.mutation<SubmitResponse, QAParams>({
        query: (params) => ({
          url: `api/v2/submit/${params.evaluation_id}`,
          method: 'POST',
          params: { session: params.session },
          body: {
            answerSets: [
              {
                answers: [{ text: params.text }],
              },
            ],
          },
        }),

        async onQueryStarted(params, { queryFulfilled }) {
          try {
            await queryFulfilled;
            eval_http.post(`submit`, {
              user_id: localStorage.getItem('username') || '',
              text: params.text,
            }).then();
          } catch (err) {
            console.error('Submit or logging failed:', err);
          }
        },
      }),

      submitKISAnswering: builder.mutation<SubmitResponse, KISParams & { user_id: string }>({
        query: (params) => {
          const answer = params.start != undefined && params.end != undefined
            ? {
                mediaItemName: params.mediaItemName,
                start: params.start,
                end: params.end,
              }
            : {
                mediaItemName: params.mediaItemName,
              };

          return {
            url: `api/v2/submit/${params.evaluation_id}`,
            method: 'POST',
            params: { session: params.session },
            body: {
              answerSets: [
                {
                  answers: [answer],
                },
              ],
            },
          };
        },

        async onQueryStarted(params, { queryFulfilled }) {
          try {
            await queryFulfilled;
            eval_http.post('submit', {
              user_id: localStorage.getItem('username') || '',
              media_item_name: params.mediaItemName,
            }).then();
          } catch (err) {
            console.error('Submission or logging failed:', err);
          }
        },
      }),
    }
  },
})
