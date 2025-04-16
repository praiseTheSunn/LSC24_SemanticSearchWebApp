import { createApi } from '@reduxjs/toolkit/query/react'
import { GoogleTranslateQuery } from '.'
// import { TranslateApiKey } from './googleApiKey'

type ResquestParams = {
  q: string
  target: string
}

type TranslationResponse = {
  translatedText: string
  detectedSourceLanguage: string
}

const decodeHtmlEntities = (str: string): string => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(str, 'text/html')
  return doc.documentElement.textContent || ''
}

export const GoogleApi = createApi({
  reducerPath: 'GoogleApi',
  baseQuery: GoogleTranslateQuery,
  tagTypes: ['Google'],
  endpoints(builder) {
    return {
      getTranslatedText: builder.query<TranslationResponse, ResquestParams>({
        query: (params) => {
          const newParams = { ...params }
          return {
            url: '/language/translate/v2',
            method: 'POST',
            params: newParams,
          }
        },
        transformResponse: (response: any) => {
          if (response.data) {
            const translation = response.data.translations[0]
            translation.translatedText = decodeHtmlEntities(
              translation.translatedText,
            )
            return translation
          }
          response.translatedText = decodeHtmlEntities(response.translatedText)
          return response
        },
        providesTags: (result) => [{ type: 'Google', id: 'TRANSLATED_TEXT' }],
      }),
    }
  },
})
