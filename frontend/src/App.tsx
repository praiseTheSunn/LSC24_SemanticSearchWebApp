import './App.css'
import React from 'react'
import { ToastContainer } from 'react-toastify'
import { StoreProvider } from './AppState'
import Routers from './Routers/Routers'
import 'react-toastify/dist/ReactToastify.css'

function App() {
  return (
    <StoreProvider>
      <ToastContainer
        style={{ zIndex: '99999999' }}
        autoClose={2000}
        limit={3}
        pauseOnFocusLoss={false}
        closeOnClick={true}
      />
      <Routers />
    </StoreProvider>
  )
}

export default App
