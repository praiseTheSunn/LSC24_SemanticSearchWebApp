import { createApi } from '@reduxjs/toolkit/query/react'
import { OpenAiQuery } from '.'
import { OpenAiApiKey } from './openAiApiKey'

type ResquestParams = {
  q: string
  // target: string
}

type TranslationResponse = {
  translatedText: string
  // detectedSourceLanguage: string
}

const decodeHtmlEntities = (str: string): string => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(str, 'text/html')
  return doc.documentElement.textContent || ''
}

export const OpenAiApi = createApi({
  reducerPath: 'OpenAiApi',
  baseQuery: OpenAiQuery,
  tagTypes: ['OpenAi'],
  endpoints(builder) {
    return {
      getLLMText: builder.query<TranslationResponse, ResquestParams>({
        query: (params) => {
          const prompt = `Translate the following text to English and refine to be more descriptive. Only include the answer. Text: \n"${params.q}"`
          return {
            url: '/v1/responses',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${OpenAiApiKey}`,
            },
            body: {
              model: 'gpt-4.1-mini', // or another model you prefer
              input: prompt,
            },
          }
        },
        transformResponse: (response: any) => {
          if (response.output) {
            const text =
              response?.output?.[0]?.content?.[0]?.text?.trim() || ''
            return {
              translatedText: decodeHtmlEntities(text),
            }
          }
          response.translatedText = decodeHtmlEntities(response.translatedText)
          return response
        },
        providesTags: (result) => [{ type: 'OpenAi', id: 'TRANSLATED_TEXT' }],
      }),
    }
  },
})
