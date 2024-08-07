import axios from 'axios'
const http_obj = axios.create({
  baseURL: 'http://34.124.236.208:8000/',
  headers: {
    'Content-type': 'application/json',
  },
})

const searchObjectPosition = (objList) => {
  return http_obj.post('/obj/positioning', objList)
}

export const ObjectService = {
  searchObjectPosition,
}
