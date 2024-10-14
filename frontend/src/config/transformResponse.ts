import type { ApiResponse } from '../types/api'
import type { ImageRecord } from '../types/image'

export const transformResponse_AIC2024 = (response: ApiResponse) => {
  // console.log('Response:', response);
  const data = response.response || response.data
  const result = data.map((img: ImageRecord) => {
    img.date = img.video_id ? img.video_id : img.date
    img.time = img.frame_id ? img.frame_id : img.time
    img.img_link = img.img_link.replace('178.128.117.254/AIC_IMAGE', '127.0.0.1:8080')
    return img
  })
  return result
}
