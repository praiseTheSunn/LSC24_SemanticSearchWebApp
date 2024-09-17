import { createSlice } from '@reduxjs/toolkit'
import type { EvaluationState } from '../types/app'

const initialState: EvaluationState = {
  evaluationId: null,
  username: '',
  password: '',
}

export const evaluationSlice = createSlice({
  initialState,
  name: 'evaluation',
  reducerPath: 'evaluation',
  reducers: {
    setPassword: (state, action) => {
      state.password = action.payload
    },
    setUsername: (state, action) => {
      state.username = action.payload
    },
    setEvaluationId: (state, action) => {
      state.evaluationId = action.payload
    },
  },
})
