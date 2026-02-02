import type { ApiResponse, FeedbackResponse } from '../types/api'
import type { ImageRecord } from '../types/image'
import { BASE_API_URL } from '../types/constants'

export const transformResponse_Feedback_LSC = (response: FeedbackResponse) => {

  const data = response.response || response.data
  console.log('Transformed feedback data:', data);

  const likes = data.like.map((img: ImageRecord) => {
    img.date = img.video_id ? img.video_id : img.date
    img.time = img.timestamp ? String(Number(img.timestamp) * 1000) : img.time
    if (BASE_API_URL.includes('158.39.201.121')) {
      img.img_link = img.img_link.replace('server.selab.edu.vn:20716', '158.39.201.121:20723')
    }
    if (img.neighbors) {
      for (const neighbor of img.neighbors) {
        if (BASE_API_URL.includes('158.39.201.121')) {
          neighbor.img_link = neighbor.img_link.replace('server.selab.edu.vn:20716', '158.39.201.121:20723')
        }
      }
    }
    return img
  })

  const dislikes = data.dislike.map((img: ImageRecord) => {
    img.date = img.video_id ? img.video_id : img.date
    img.time = img.timestamp ? String(Number(img.timestamp) * 1000) : img.time
    if (BASE_API_URL.includes('158.39.201.121')) {
      img.img_link = img.img_link.replace('server.selab.edu.vn:20716', '158.39.201.121:20723')
    }
    if (img.neighbors) {
      for (const neighbor of img.neighbors) {
        if (BASE_API_URL.includes('158.39.201.121')) {
          neighbor.img_link = neighbor.img_link.replace('server.selab.edu.vn:20716', '158.39.201.121:20723')
        }
      }
    }
    return img
  })

  const result = {
    like: likes,
    dislike: dislikes,
  }
  console.log('Transformed feedback response:', result);

  return result
}

export const transformResponse_Feedback_AIC2025 = (response: FeedbackResponse) => {

  const data = response.response || response.data
  console.log('Transformed feedback data:', data);

  const likes = (data as any).like.map((img: ImageRecord) => {
    img.img_link = img.img_link.replace('server.selab.edu.vn:20716', '127.0.0.1:8080')
    img.img_link = `${img.img_link.substring(0, 22) + img.img_link.substring(22, 25)}/${img.img_link.substring(22)}`
    img.img_link = img.img_link.replace('jpg', 'webp')
   if (img.neighbors) {
      for (const neighbor of img.neighbors) {
        neighbor.img_link = neighbor.img_link.replace('server.selab.edu.vn:20716', '127.0.0.1:8080')
        neighbor.img_link = `${neighbor.img_link.substring(0, 22) + neighbor.img_link.substring(22, 25)}/${neighbor.img_link.substring(22)}`
        neighbor.img_link = neighbor.img_link.replace('jpg', 'webp')
      }
    }
    return img
  })

  const dislikes = (data as any).dislike.map((img: ImageRecord) => {
    img.img_link = img.img_link.replace('server.selab.edu.vn:20716', '127.0.0.1:8080')
    img.img_link = `${img.img_link.substring(0, 22) + img.img_link.substring(22, 25)}/${img.img_link.substring(22)}`
    img.img_link = img.img_link.replace('jpg', 'webp')
    if (img.neighbors) {
      for (const neighbor of img.neighbors) {
        neighbor.img_link = neighbor.img_link.replace('server.selab.edu.vn:20716', '127.0.0.1:8080')
        neighbor.img_link = `${neighbor.img_link.substring(0, 22) + neighbor.img_link.substring(22, 25)}/${neighbor.img_link.substring(22)}`
        neighbor.img_link = neighbor.img_link.replace('jpg', 'webp')
      }
    }
    return img
  })

  const result = {
    like: likes,
    dislike: dislikes,
  }
  console.log('Transformed feedback response:', result);

  return result
}


export const transformResponse_Feedback_VBS25V3C = (response: FeedbackResponse) => {

  const data = response.response || response.data
  console.log('Transformed feedback data:', data);
  
  const likes = (data as any).like.map((img: ImageRecord) => {
    // nếu ở ngoài lab thì comment dòng dưới lại
    img.img_link = img.img_link.replace('if-wan4.selab.edu.vn:20717', '10.0.1.21:20717')
    
    if (img.neighbors) {
        for (const neighbor of img.neighbors) {
          // nếu ở ngoài lab thì comment dòng dưới lại
          neighbor.img_link = neighbor.img_link.replace('if-wan4.selab.edu.vn:20717', '10.0.1.21:20717')
        }
      }

    return img
  })

  const dislikes = (data as any).dislike.map((img: ImageRecord) => {
    // // nếu ở ngoài lab thì comment dòng dưới lại
    img.img_link = img.img_link.replace('if-wan4.selab.edu.vn:20717', '10.0.1.21:20717')
    
    if (img.neighbors) {
        for (const neighbor of img.neighbors) {
          // nếu ở ngoài lab thì comment dòng dưới lại
          neighbor.img_link = neighbor.img_link.replace('if-wan4.selab.edu.vn:20717', '10.0.1.21:20717')
        }
      }

    return img
  })

  const result = {
    like: likes,
    dislike: dislikes,
  }
  console.log('Transformed feedback response:', result);

  return result
}

// export const transformResponse_AIC2024 = (response: ApiResponse) => {
//   // console.log('Response:', response);
//   const convertToMMSS = (seconds: string): string => {
//     const iSeconds = Number(seconds)
//     const minutes = Math.floor(iSeconds / 60)
//     const remainingSeconds = iSeconds % 60
//     return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
//   }

//   const data = response.response || response.data
//   const result = data.map((img: ImageRecord) => {
//     img.date = img.context_id_coarse
//       ? img.context_id_coarse
//       : img.video_id
//         ? img.video_id
//         : img.date
//     // img.date = img.video_id ? img.video_id : img.date
//     // img.time = img.timestamp ? String(Number(img.timestamp) * 1000) : img.time
//     img.time = img.timestamp ? convertToMMSS(String(img.timestamp)) : img.time
//     img.img_link = img.img_link.replace('178.128.117.254', '127.0.0.1:8080')

//     return img
//   })
//   return result
// }

// export const transformResponse_Feedback_AIC = (response: ApiResponse) => {
//   // console.log('Response:', response);
//   const convertToMMSS = (seconds: string): string => {
//     const iSeconds = Number(seconds)
//     const minutes = Math.floor(iSeconds / 60)
//     const remainingSeconds = iSeconds % 60
//     return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
//   }
//   const data = response.response || response.data
//   const likes = data.like[0].map((img: ImageRecord) => {
//     img.date = img.context_id_coarse
//       ? img.context_id_coarse
//       : img.video_id
//         ? img.video_id
//         : img.date
//     img.time = img.timestamp ? convertToMMSS(img.timestamp) : img.time
//     img.img_link = img.img_link.replace('178.128.117.254', '127.0.0.1:8080')
//     return img
//   })

//   const dislikes = data.dislike[0].map((img: ImageRecord) => {
//     img.date = img.context_id_coarse
//       ? img.context_id_coarse
//       : img.video_id
//         ? img.video_id
//         : img.date
//     img.time = img.timestamp ? convertToMMSS(img.timestamp) : img.time
//     img.img_link = img.img_link.replace('178.128.117.254', '127.0.0.1:8080')
//     return img
//   })

//   const result = {
//     like: likes,
//     dislike: dislikes,
//   }

//   return result
// }
export const transformResponse_AIC2025 = (response: ApiResponse) => {
  const data = response.response || response.data
  const result = data.map((img: ImageRecord) => {
    img.date = img.video_id ? img.video_id : img.date
    img.time = img.timestamp ? String(Number(img.timestamp) * 1000) : img.time
    img.img_link = img.img_link.replace('server.selab.edu.vn:20716', '127.0.0.1:8080')
    img.img_link = `${img.img_link.substring(0, 22) + img.img_link.substring(22, 25)}/${img.img_link.substring(22)}`
    img.img_link = img.img_link.replace('jpg', 'webp')
    if (img.neighbors) {
      for (const neighbor of img.neighbors) {
        neighbor.img_link = neighbor.img_link.replace('server.selab.edu.vn:20716', '127.0.0.1:8080')
        neighbor.img_link = `${neighbor.img_link.substring(0, 22) + neighbor.img_link.substring(22, 25)}/${neighbor.img_link.substring(22)}`
        neighbor.img_link = neighbor.img_link.replace('jpg', 'webp')
      }
    }

    return img
  })
  return result
}

// export const transformResponse_Feedback_AIC = (response: FeedbackResponse) => {
//   // console.log('Response:', response);
//   const convertToMMSS = (seconds: string): string => {
//     const iSeconds = Number(seconds)
//     const minutes = Math.floor(iSeconds / 60)
//     const remainingSeconds = iSeconds % 60
//     return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
//   }
//   const data = response.response || response.data
//   const likes = data.like[0].map((img: ImageRecord) => {
//     img.date = img.context_id_coarse
//       ? img.context_id_coarse
//       : img.video_id
//         ? img.video_id
//         : img.date
//     img.time = img.timestamp ? convertToMMSS(img.timestamp) : img.time
//     img.img_link = img.img_link.replace('178.128.117.254', '127.0.0.1:8080')
//     return img
//   })

//   const dislikes = data.dislike[0].map((img: ImageRecord) => {
//     img.date = img.context_id_coarse
//       ? img.context_id_coarse
//       : img.video_id
//         ? img.video_id
//         : img.date
//     img.time = img.timestamp ? convertToMMSS(img.timestamp) : img.time
//     img.img_link = img.img_link.replace('178.128.117.254', '127.0.0.1:8080')
//     return img
//   })

//   const result = {
//     like: likes,
//     dislike: dislikes,
//   }

//   return result
// }

// export const transformResponse_VBS2025 = (response: ApiResponse) => {
//   // console.log('Response:', response);
//   const convertToMMSS = (seconds: string): string => {
//     const iSeconds = Number(seconds)
//     const minutes = Math.floor(iSeconds / 60)
//     const remainingSeconds = iSeconds % 60
//     return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
//   }

//   const data = response.response || response.data
//   const result = data.map((img: ImageRecord) => {
//     img.date = img.context_id_coarse
//       ? img.context_id_coarse
//       : img.video_id
//         ? img.video_id
//         : img.date
//     // img.date = img.video_id ? img.video_id : img.date
//     // img.time = img.timestamp ? String(Number(img.timestamp) * 1000) : img.time
//     // img.time = img.timestamp ? convertToMMSS(img.timestamp) : img.time
//     if (img.neighbors && img.neighbors.length > 0) {
//       for (let i = 0; i < img.neighbors.length; i++) {
//         img.neighbors[i].date = img.neighbors[i].context_id_coarse
//           ? img.neighbors[i].context_id_coarse
//           : img.neighbors[i].video_id
//             ? img.neighbors[i].video_id
//             : img.neighbors[i].date
//         // img.neighbors[i].time = img.neighbors[i].timestamp
//         //   ? convertToMMSS(img.neighbors[i].timestamp)
//         //   : img.neighbors[i].time
//       }
//     }

//     // img.img_link = img.img_link.replace('127.0.0.1:8000', '127.0.0.1:8080')

//     return img
//   })
//   return result
// }


// export const transformResponse_Feedback_Thesis = (response: ApiResponse) => {

//   const data = response.response || response.data

//   const result = {
//     like: data.like,
//     dislike: data.dislike,
//   }

//   return result
// }


export const transformResponse_LSC = (response: ApiResponse) => {
  const data = response.response || response.data
  const result = data.map((img: ImageRecord) => {
    img.date = img.video_id ? img.video_id : img.date
    img.time = img.timestamp ? String(Number(img.timestamp) * 1000) : img.time
    // nếu ở ngoài lab thì comment dòng dưới lại
    // img.img_link = img.img_link.replace('server.selab.edu.vn:20716', '10.0.1.21:20716')
    // bergen
    // if IP of BASE_API_URL is 158.39.201.121 then replace with that IP
    if (BASE_API_URL.includes('158.39.201.121')) {
      img.img_link = img.img_link.replace('server.selab.edu.vn:20716', '158.39.201.121:20723')
    }
    
    if (img.neighbors) {
        for (const neighbor of img.neighbors) {
          // nếu ở ngoài lab thì comment dòng dưới lại
          // neighbor.img_link = neighbor.img_link.replace('server.selab.edu.vn:20716', '10.0.1.21:20716')
          // bergen
          if (BASE_API_URL.includes('158.39.201.121')) {
            neighbor.img_link = neighbor.img_link.replace('server.selab.edu.vn:20716', '158.39.201.121:20723')
          }
        }
      }

    return img
  })
  return result
}

export const transformResponse_VBS25V3C = (response: ApiResponse) => {
  const data = response.response || response.data
  const result = data.map((img: ImageRecord) => {
    // nếu ở ngoài lab thì comment dòng dưới lại
    img.img_link = img.img_link.replace('if-wan4.selab.edu.vn:20717', '10.0.1.21:20717')
    
    if (img.neighbors) {
        for (const neighbor of img.neighbors) {
          // nếu ở ngoài lab thì comment dòng dưới lại
          neighbor.img_link = neighbor.img_link.replace('if-wan4.selab.edu.vn:20717', '10.0.1.21:20717')
        }
      }

    return img
  })
  return result
}

export const convertTimeToMs = (timeStr: string | undefined): number => {
  if (!timeStr) return 0
  const [mm, rest] = timeStr.split(':')
  const [ss, ms] = rest.split('.')
  return (
    Number(mm) * 60 * 1000 +
    Number(ss) * 1000 +
    Number(ms || 0)
  )
}

/**
 * Get the appropriate transform response function based on dataset
 * Defaults to LSC format for unknown datasets
 */
export const getTransformResponseFunction = (
  dataset: string | undefined,
): ((response: ApiResponse) => ImageRecord[]) => {
  switch (dataset?.toLowerCase()) {
    case 'vbs25_v3c':
    case 'vbs25_mvk':
    case 'vbs25_lhe':
      return transformResponse_VBS25V3C
    case 'aic2025':
    case 'aic25':
      return transformResponse_AIC2025
    case 'lsc24':
    case 'lsc':
    default:
      return transformResponse_LSC
  }
}

/**
 * Transform response based on dataset
 * Defaults to LSC format for unknown datasets
 */
export const transformResponseByDataset = (
  dataset: string | undefined,
  response: ApiResponse,
): ImageRecord[] => {
  const transformFunction = getTransformResponseFunction(dataset)
  return transformFunction(response)
}

/**
 * Get the appropriate feedback transform function based on dataset
 * Defaults to LSC feedback format for unknown datasets
 */
export const getTransformFeedbackFunction = (
  dataset: string | undefined,
): ((response: FeedbackResponse) => { like: ImageRecord[]; dislike: ImageRecord[] }) => {
  switch (dataset?.toLowerCase()) {
    case 'aic2025':
    case 'aic25':
      return transformResponse_Feedback_AIC2025
    case 'vbs25_v3c':
    case 'vbs25_mvk':
    case 'vbs25_lhe':
      return transformResponse_Feedback_VBS25V3C
    case 'lsc24':
    case 'lsc':
    default:
      return transformResponse_Feedback_LSC
  }
}