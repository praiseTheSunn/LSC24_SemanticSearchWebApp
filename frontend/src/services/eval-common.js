import axios from 'axios'
import { BASE_API_URL } from '../types/constants'
const baseURL = BASE_API_URL

if (!baseURL) {
  throw new Error(
    'REACT_APP_EVALUATION_API_URL is not defined in the .env file',
  )
}

export const eval_http = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-type': 'application/json',
  },
})

export default eval_http
