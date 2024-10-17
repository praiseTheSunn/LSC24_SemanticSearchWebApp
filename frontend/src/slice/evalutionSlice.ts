import { createSlice } from '@reduxjs/toolkit'
import type { EvaluationState } from '../types/app'
import { initial, set } from 'lodash'

const initialState: EvaluationState = {
  sessionId: null,
  evaluationId: null,
  username: '',
  password: '',
}

export const evaluationSlice = createSlice({
  initialState,
  name: 'evaluation',
  reducerPath: 'evaluation',
  reducers: {
    setSessionId: (state, action) => {
      console.log(action.payload)
      state.sessionId = action.payload
    },
    setPassword: (state, action) => {
      console.log(action.payload)
      state.password = action.payload
    },
    setUsername: (state, action) => {
      console.log(action.payload)
      state.username = action.payload
    },
    setEvaluationId: (state, action) => {
      console.log("hi", action.payload)
      state.evaluationId = action.payload
    },
  },
})
