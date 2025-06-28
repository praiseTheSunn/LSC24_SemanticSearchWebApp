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
  '-act ': { category: 'activity', startIndex: 5, display: '-act ... : Activity' },
  '-ocr ': { category: 'ocr', startIndex: 5, display: '-ocr ... : OCR text' },
  '-loc ': { category: 'location', startIndex: 5, display: '-loc ... : Location' },
  '-d ': {category: 'date', startIndex: 3, display: '-d ... : date'},
  '-t ': {category: 'time', startIndex: 3, display: '-t ... : time'},
  '-textasdasdsa ': {category: 'SUBMIT TEXT', startIndex: 6, display: '-text ... : Submit text'},
}

export const FilterCategories = FilterCategories_LSC2024
