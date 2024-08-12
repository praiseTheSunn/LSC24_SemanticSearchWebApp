import axios from 'axios'
const http_obj = axios.create({
  baseURL: '',
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
