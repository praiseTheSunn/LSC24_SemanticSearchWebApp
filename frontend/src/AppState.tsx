import { combineReducers, configureStore } from '@reduxjs/toolkit'
import type React from 'react'
import { useRef } from 'react'
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
  useStore,
} from 'react-redux'
import { Provider } from 'react-redux'
import { GoogleApi } from './services/googleApi'
import { ImageApi } from './services/imageApi'
import { ObjectPosApi } from './services/objectApi'
import { evaluationSlice } from './slice/evalutionSlice'
import { sliceApp } from './slice/sliceApp'

const makeStore = () => {
  return configureStore({
    reducer: combineReducers({
      app: sliceApp.reducer,
      [evaluationSlice.reducerPath]: evaluationSlice.reducer,
      [ObjectPosApi.reducerPath]: ObjectPosApi.reducer,
      [ImageApi.reducerPath]: ImageApi.reducer,
      [GoogleApi.reducerPath]: GoogleApi.reducer,
    }),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat([
        ObjectPosApi.middleware,
        ImageApi.middleware,
        GoogleApi.middleware,
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
export const evaluationActions = evaluationSlice.actions
export const { useLazyGetObjectsByPositionQuery } = ObjectPosApi

export const {
  useLazyGetImagesQuery,
  useGetSimilarsQuery,
  useLazyGetNeighborsQuery,
  useLazySearchByImageQuery,
  useGetLikeSimilarImagesQuery,
  useGetDislikeSimilarImagesQuery,
} = ImageApi

export const { useLazyGetTranslatedTextQuery } = GoogleApi
