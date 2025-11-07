import { createApi } from '@reduxjs/toolkit/query/react'
import { OpenAiQuery } from '.'
import { OpenAiApiKey } from './openAiApiKey'

type RequestParams = {
  q: string
}

type TranslationResponse = {
  translatedText: string
}

const decodeHtmlEntities = (str: string): string => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(str, 'text/html')
  return doc.documentElement.textContent || ''
}

// helper function to extract text and remainder
const splitQuery = (input: string): { textToTranslate: string; remainder: string } => {
  const match = input.match(/\s-(\w+)/)
  if (match && match.index !== undefined) {
    const splitIndex = match.index
    return {
      textToTranslate: input.slice(0, splitIndex).trim(),
      remainder: input.slice(splitIndex),
    }
  }
  return { textToTranslate: input.trim(), remainder: '' }
}

export const OpenAiApi = createApi({
  reducerPath: 'OpenAiApi',
  baseQuery: OpenAiQuery,
  tagTypes: ['OpenAi'],
  endpoints(builder) {
    return {
      getLLMText: builder.query<TranslationResponse, RequestParams>({
        query: (params) => {
          const { textToTranslate, remainder } = splitQuery(params.q)

          const prompt = `Translate the following text to English and refine to be more descriptive. Only include the answer. Text:\n"${textToTranslate}"`

          return {
            url: '/v1/responses',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${OpenAiApiKey}`,
            },
            body: {
              model: 'gpt-4o-mini',
              input: prompt,
            },
          }
        },
        transformResponse: (response: any, _meta: any, arg: RequestParams) => {
          const { remainder } = splitQuery(arg.q)
          const translated =
            response?.output?.[0]?.content?.[0]?.text?.trim() || ''
          const decoded = decodeHtmlEntities(translated)

          console.log('Full translated text:', decoded + remainder)

          return { translatedText: decoded + remainder }
        },
        providesTags: [{ type: 'OpenAi', id: 'TRANSLATED_TEXT' }],
      }),
    }
  },
})
