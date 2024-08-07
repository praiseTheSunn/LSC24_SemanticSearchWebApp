import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider as Provider, createTheme } from '@mui/material/styles'
import type React from 'react'
import '../styles/index.scss'

const darkTheme = createTheme({
  palette: {
    // mode: 'dark',
    mode: 'light',
  },
})

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider theme={darkTheme}>
      <CssBaseline />
      {children}
    </Provider>
  )
}
