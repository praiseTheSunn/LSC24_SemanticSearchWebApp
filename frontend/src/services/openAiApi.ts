import { createApi } from '@reduxjs/toolkit/query/react'
import { OpenAiQuery } from '.'
import { OpenAiApiKey } from './openAiApiKey'

type RequestParams = {
  q: string
  llm_model: string
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

          // const prompt = `Translate the following text to English and refine to be more descriptive. Only include the answer. Text:\n"${textToTranslate}"`
          const prompt = `
          You are an AI assistant specialized in translating Vietnamese sentences into English for use as input to a Vision-Language Model (VLM). 

          Instructions:

          • Only output the translated English sentence (no explanations, no quotes, no extra formatting).
          • Maintain the contextual meaning from the Vietnamese source.
          • Do not add or assume unrealistic or unrelated details beyond what is implied.
          • Enhance the translation to be more descriptive while preserving the original meaning.

          Examples:
          Input: Cảnh quay các con động vật nối đuôi nhau. Con đi đầu lớn nhất, các con phía sau có kích thước lần lượt là nhỏ lớn nhỏ lớn.
          Output: A group of animals is moving in a line, with the largest one leading and the others alternating between small and large sizes.

          Input: Trong đoạn video nhìn thấy rất nhiều khinh khí cầu. Có cái có hình cờ hải tặc Luffy trong anime One Piece. Có cái thể hiện hình ảnh người Na'vi trong phim Avatar.
          Output: Many hot air balloons can be seen in the video, including one decorated with Luffy’s pirate flag from One Piece and another featuring a Na'vi character from the movie Avatar.

          Input: Múa rồng, những người biểu diễn múa rồng mặc trang phục của các vận động viên bóng đá.
          Output: A dragon dance performance where the performers are dressed like soccer players.

          Now translate the following input into a refined, descriptive English sentence: 
          "${textToTranslate}"
          `

          return {
            url: '/v1/responses',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${OpenAiApiKey}`,
            },
            body: {
              model: params.llm_model,
              input: prompt,
            },
          }
        },
        transformResponse: (response: any, _meta: any, arg: RequestParams) => {
          const { remainder } = splitQuery(arg.q)

          // Find the first output item with type === 'message'
          const messageItem = response?.output?.find((item: any) => item?.type === 'message')

          const translated =
            messageItem?.content?.[0]?.text?.trim() || ''

          const decoded = decodeHtmlEntities(translated)

          console.log('Full translated text:', decoded + remainder)

          return { translatedText: decoded + remainder }
        },
        providesTags: [{ type: 'OpenAi', id: 'TRANSLATED_TEXT' }],
      }),
    }
  },
})
