import { Dictionary } from 'lodash'
import type { ImageRecord } from './image'

export type ApiResponse = {
  data: ObjPosResponse[] | ImageRecord[]
  response?: ObjPosResponse[] | ImageRecord[]
  status: number
}

export type ApiError = {
  message: string
  status: number
}

export type ObjPosResponse = {
  img_link: string
  score?: number
  date: string
  time: string
  ocr: string
  caption: string
  location: string
  activity: string
  new_lat?: number
  new_lng?: number
  activity_id: number
  event_id: number
  location_id: number
  object_tags: string
  day_of_week: string
  location_displayed: string
  video_url?: string
  timestamp?: string
  video_id?: string
  frame_id?: string
}

export type TextQueryParams = {
  text_query: string
  mode: string
  model: string
  object_global_encoding?: { [key: string]: number }
  object_local_encoding?: string
  color_global_encoding?: { [key: string]: number }
  color_local_encoding?: string
  dataset?: string
}

export type ExploreSimilarParams = {
  image_urls: string[] | undefined
  model: string
  dataset?: string
}

export type ExploreNeighborParams = {
  image_url: string
  span: number
  dataset?: string
}

export type ImageQueryParams = {
  image_base64: string | ArrayBuffer
  model: string
  dataset?: string
}

export type ObjPosParams = {
  object_name: string
  top_left_x: number
  top_left_y: number
  bottom_right_x: number
  bottom_right_y: number
}

export type EvalLoginParams = {
  username: string
  password: string
}

export type LoginResponse = {
  id: string
  role: string
  sessionId: string
  username: string
}

export type EvalIDResponse = {
  id: string
  name: string
  type: string
  status: string
}

export type EvalTextParams = {
  session: string
}

export type QAParams = {
  session: string
  evaluation_id: string
  text: string
}

export type KISParams = {
  session: string
  evaluation_id: string
  mediaItemName: string
  start: number
  end: number
}

export type FeedbackQueryParams = {
  like: {
    text_query: string,
    image_urls: [
      string
    ],
    limit: 0,
  },
  dislike: {
    image_urls: [
      string
    ],
    limit: 0,
  }
  model: string,
  dataset: string
}

