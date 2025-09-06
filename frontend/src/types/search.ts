export type SearchTermType = { category: string; value: string }
export type FilterTagType = {
  category: string
  value: string | string[]
  status: number
}
export type QueryPayload = {
  model: string
  mode: string
  text_query: string
  dataset: string
  temporal_window_size: number
  use_temporal_window: boolean
  display_window_size: number
  user_id: string
}
