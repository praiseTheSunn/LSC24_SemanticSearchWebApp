import axios from "axios";


export const http =  axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  headers: {
    "Content-type": "application/json",
  }
});

export default http;