import axios from 'axios'
import { BASE_API_URL } from '../types/constants'
const baseURL = "aaa"

if (!baseURL) {
  throw new Error('REACT_APP_BASE_URL is not defined in the .env file')
}

export const http = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-type': 'application/json',
  },
})

export default http
