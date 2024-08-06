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
import { evaluationSlice } from './slice/evalutionSlice'

const makeStore = () => {
  return configureStore({
    reducer: combineReducers({
      app: sliceApp.reducer,
      [evaluationSlice.reducerPath]: evaluationSlice.reducer,
    }),
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat([]),
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
export const evaluationActions = evaluationSlice.actions
