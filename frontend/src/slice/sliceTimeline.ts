import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { TimelineState } from '../types/app'
import { TimelineTabLocationAllData, TimelineTabActivityAllData } from '../types/image'

const initialState: TimelineState = {
  selectedDate: null,
  inHoldMode: false,
//   locationBasedData: {},
//   activityBasedData: {},
}

export const sliceTimeline = createSlice({
  name: 'sliceTimeline',
  initialState,
  reducers: {
    setSelectedDate(state, action) {
      state.selectedDate = action.payload
    },
    setInHoldMode(state, action) {
      state.inHoldMode = action.payload
    },
    // setLocationBasedData(state, action) {
    //   state.locationBasedData = action.payload
    // },
    // setActivityBasedData(state, action) {
    //   state.activityBasedData = action.payload
    // },
  },
})
