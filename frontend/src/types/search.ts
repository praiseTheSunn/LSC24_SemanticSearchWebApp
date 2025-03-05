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
  user_id: string
}
