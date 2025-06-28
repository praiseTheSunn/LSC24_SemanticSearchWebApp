import { Score } from "@mui/icons-material"

const BaseFieldToDisplay = {
  caption: 'Caption',
  ocr: 'OCR',
  object_tags: 'Object Tags',
  score: 'Score',
}

export const AIC2024_fieldToDisplay = {
  video_id: 'Video ID',
  timestamp: 'Timestamp',
  ...BaseFieldToDisplay,
  img_link: 'FrameID',
  object_global_encoding: 'Object',
  context_en_keywords: 'Context',
}

export const VBS2025_fieldToDisplay = {
  video_id: 'Video ID',
  timestamp: 'Timestamp',
  img_link: 'Image Name',
  frame_id: 'Frame ID',
  object_tags: 'Object Tags',
  score: 'Score',
}

export const LSC_fieldToDisplay = {
  activity: "Activity",
  ocr: "OCR",
  location: "Location",
  score: "Score",
}

export const FieldToDisplay = LSC_fieldToDisplay

