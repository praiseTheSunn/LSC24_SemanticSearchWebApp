import axios from 'axios'
const baseURL = process.env.REACT_APP_BASE_URL

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
