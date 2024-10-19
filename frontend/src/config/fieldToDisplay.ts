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


export const FieldToDisplay = AIC2024_fieldToDisplay