const FilterCategories_AIC2024 = {
  '-lo': { category: 'location', startIndex: 4, display: '-lo ... : location' },
  '-t': { category: 'timestamp', startIndex: 3, display: '-t ... : time' },
  '-d': { category: 'date', startIndex: 3, display: '-d ... : date' },
  '-ocr': { category: 'ocr', startIndex: 5, display: '-ocr ... : OCR text' },
  '-obj': {
    category: 'object_tags',
    startIndex: 5,
    display: '-obj ... : Object Detection',
  },
  '-cap': { category: 'caption', startIndex: 5, display: '-cap ... : Caption' },
  '-ctx': {
    category: 'context_en_keywords',
    startIndex: 5,
    display: '-ctx ... : Context',
  },
  '-v': { category: 'video_id', startIndex: 3, display: '-v ... : Video ID' },
}

const FilterCategories_VBS2025 = {
  '-t': { category: 'timestamp', startIndex: 3, display: '-t ... : timestamp' },
  '-obj': {
    category: 'object_tags',
    startIndex: 5,
    display: '-obj ... : Object Detection',
  },
  '-v': { category: 'video_id', startIndex: 3, display: '-v ... : Video ID' },
}

const FilterCategories_LSC2024 = {
  '-a ': { category: 'activity', startIndex: 3, display: '-a ... : Activity' },
  '-ocr ': { category: 'ocr', startIndex: 5, display: '-ocr ... : OCR text' },
  '-l ': { category: 'location', startIndex: 3, display: '-l ... : Location' },
  '-d ': {category: 'date', startIndex: 3, display: '-d ... : date (e.g., 2024-01-30)'},
  // '-t ': {category: 'time', startIndex: 3, display: '-t ... : time (only frontend filter)'},
  '-tr ': { category: 'transcript', startIndex: 4, display: '-tr ... : Transcript' },
  '-textasdasdsa ': {category: 'SUBMIT TEXT', startIndex: 6, display: '-text ... : Submit text'},
}

export const FilterCategories = FilterCategories_LSC2024
