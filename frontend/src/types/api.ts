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
}

export type ImageQueryParams = {
  image_base64: string | ArrayBuffer
  model: string
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
