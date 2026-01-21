/**
 * Dataset-specific time formatting functions
 */

/**
 * Format time for LSC24 dataset
 * Extracts timestamp from image link
 */
export const formatTimeLSC24 = (date: string, time: string): string => {
  return `${date ? date : ''}-${time ? time : ''}`
}

/**
 * Format time for VBS25_V3C dataset
 * Combines date and time
 */
export const formatTimeVBS25V3C = (src: string): string => {
  const parts = src.split('/')
  // first take video_id between 4th '/' and 5th '/'
  const videoId = parts[4] || ''
  // then take timestamp between 2 last '_'
  const frameId = parts[parts.length - 1].split('_').slice(-2, -1)[0] || ''
  return `${videoId}-${frameId}`
}

/**
 * Get the appropriate time formatting function based on dataset
 * Defaults to LSC24 format for unknown datasets
 */
export const getFormattedTimeFunction = (
  dataset: string | undefined,
): ((src?: string, date?: string, time?: string) => string) => {
  switch (dataset?.toLowerCase()) {
    case 'vbs25_v3c':
      return (src?: string, date?: string, time?: string) => formatTimeVBS25V3C(src ?? '')
    case 'lsc24':
    default:
      return (src?: string, date?: string, time?: string) => formatTimeLSC24(date ?? '', time ?? '')
  }
}

/**
 * Format time based on dataset
 * Defaults to LSC24 format for unknown datasets
 */
export const formatTimeByDataset = (
  dataset: string | undefined,
  src: string,
  date: string,
  time: string,
): string => {
  const formatFunction = getFormattedTimeFunction(dataset)
  return formatFunction(src, date, time)
}
