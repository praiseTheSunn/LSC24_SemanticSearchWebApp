import type React from 'react'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { useRef } from 'react'
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
  useStore,
} from 'react-redux'
import { Provider } from 'react-redux'
import { sliceApp } from './slice/sliceApp'
import { sliceTimeline } from './slice/sliceTimeline'
import { evaluationSlice } from './slice/evalutionSlice'
import { ObjectPosApi } from './services/objectApi'


const makeStore = () => {
  return configureStore({
    reducer: combineReducers({
      app: sliceApp.reducer,
      timeline: sliceTimeline.reducer,
      [evaluationSlice.reducerPath]: evaluationSlice.reducer,
      [ObjectPosApi.reducerPath]: ObjectPosApi.reducer,
    }),
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat([
      ObjectPosApi.middleware,
    ]),
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const storeRef = useRef<AppStore>()
  if (!storeRef.current) {
    storeRef.current = makeStore()
  }

  return <Provider store={storeRef.current}>{children}</Provider>
}

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
export const useAppStore: () => AppStore = useStore
export const appActions = sliceApp.actions
export const timelineActions = sliceTimeline.actions
export const evaluationActions = evaluationSlice.actions
export const {
  useLazyGetObjectsByPositionQuery
} = ObjectPosApi