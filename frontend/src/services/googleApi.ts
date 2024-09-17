import { createApi } from '@reduxjs/toolkit/query/react'
import { GoogleTranslateQuery } from '.'
import { TranslateApiKey } from './googleApiKey'

type ResquestParams = {
  q: string
  target: string
}

type TranslationResponse = {
  translatedText: string
  detectedSourceLanguage: string
}

export const GoogleApi = createApi({
  reducerPath: 'GoogleApi',
  baseQuery: GoogleTranslateQuery,
  tagTypes: ['Google'],
  endpoints(builder) {
    return {
      getTranslatedText: builder.query<TranslationResponse, ResquestParams>({
        query: (params) => {
          const newParams = { ...params, key: TranslateApiKey }
          return {
            url: '/language/translate/v2',
            method: 'POST',
            params: newParams,
          }
        },
        transformResponse: (response: any) => {
          if (response.data) {
            return response.data.translations[0]
          }
          return response
        },
        providesTags: (result) => [{ type: 'Google', id: 'TRANSLATED_TEXT' }],
      }),
    }
  },
})
