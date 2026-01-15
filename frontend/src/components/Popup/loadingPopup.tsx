import { Box, ClickAwayListener } from '@mui/material'
import { appActions, useAppDispatch, useAppSelector } from '../../AppState'
import './loadingPopup.css'
import React, { useCallback } from 'react'

const LoadingPopup = () => {
  const loadingMessage = useAppSelector(
    (state) => state.app.loadingPopUpMessage,
  )
  const dispatch = useAppDispatch()
  const setLoadingPopUp = useCallback(
    (message: string) => {
      dispatch(appActions.setLoadingPopUp(message))
    },
    [dispatch],
  )
  // console.log('loadingMessage:', loadingMessage)
  return (
    <Box className="loading-popup" style={{ zIndex: '99999' }}>
      <ClickAwayListener
        onClickAway={() => {
          if (loadingMessage.includes('Error')) setLoadingPopUp('')
        }}
      >
        <Box className="loading-container">
          {!loadingMessage.includes('Error') && <span className="loader" />}
          {loadingMessage}
        </Box>
      </ClickAwayListener>
    </Box>
  )
}

export default React.memo(LoadingPopup)
