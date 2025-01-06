import type { ApiResponse } from '../types/api'
import type { ImageRecord } from '../types/image'
// import BASE_API_URL from '../types/constants'

export const transformResponse_AIC2024 = (response: ApiResponse) => {
  // console.log('Response:', response);
  const convertToMMSS = (seconds: string): string => {
    const iSeconds = Number(seconds)
    const minutes = Math.floor(iSeconds / 60)
    const remainingSeconds = iSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
  }

  const data = response.response || response.data
  const result = data.map((img: ImageRecord) => {
    img.date = img.context_id_coarse
      ? img.context_id_coarse
      : img.video_id
        ? img.video_id
        : img.date
    // img.date = img.video_id ? img.video_id : img.date
    // img.time = img.timestamp ? String(Number(img.timestamp) * 1000) : img.time
    img.time = img.timestamp ? convertToMMSS(img.timestamp) : img.time
    img.img_link = img.img_link.replace('178.128.117.254', '127.0.0.1:8080')

    return img
  })
  return result
}

export const transformResponse_Feedback_AIC = (response: ApiResponse) => {
  // console.log('Response:', response);
  const convertToMMSS = (seconds: string): string => {
    const iSeconds = Number(seconds)
    const minutes = Math.floor(iSeconds / 60)
    const remainingSeconds = iSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
  }
  const data = response.response || response.data
  const likes = data.like[0].map((img: ImageRecord) => {
    img.date = img.context_id_coarse
      ? img.context_id_coarse
      : img.video_id
        ? img.video_id
        : img.date
    img.time = img.timestamp ? convertToMMSS(img.timestamp) : img.time
    img.img_link = img.img_link.replace('178.128.117.254', '127.0.0.1:8080')
    return img
  })

  const dislikes = data.dislike[0].map((img: ImageRecord) => {
    img.date = img.context_id_coarse
      ? img.context_id_coarse
      : img.video_id
        ? img.video_id
        : img.date
    img.time = img.timestamp ? convertToMMSS(img.timestamp) : img.time
    img.img_link = img.img_link.replace('178.128.117.254', '127.0.0.1:8080')
    return img
  })

  const result = {
    like: likes,
    dislike: dislikes,
  }

  return result
}

export const transformResponse_VBS2025 = (response: ApiResponse) => {
  // console.log('Response:', response);
  const convertToMMSS = (seconds: string): string => {
    const iSeconds = Number(seconds)
    const minutes = Math.floor(iSeconds / 60)
    const remainingSeconds = iSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
  }

  const data = response.response || response.data
  const result = data.map((img: ImageRecord) => {
    img.date = img.context_id_coarse
      ? img.context_id_coarse
      : img.video_id
        ? img.video_id
        : img.date
    // img.date = img.video_id ? img.video_id : img.date
    // img.time = img.timestamp ? String(Number(img.timestamp) * 1000) : img.time
    // img.time = img.timestamp ? convertToMMSS(img.timestamp) : img.time
    if (img.neighbors && img.neighbors.length > 0) {
      for (let i = 0; i < img.neighbors.length; i++) {
        img.neighbors[i].date = img.neighbors[i].context_id_coarse
          ? img.neighbors[i].context_id_coarse
          : img.neighbors[i].video_id
            ? img.neighbors[i].video_id
            : img.neighbors[i].date
        // img.neighbors[i].time = img.neighbors[i].timestamp
        //   ? convertToMMSS(img.neighbors[i].timestamp)
        //   : img.neighbors[i].time
      }
    }

    // img.img_link = img.img_link.replace('127.0.0.1:8000', '127.0.0.1:8080')

    return img
  })
  return result
}
