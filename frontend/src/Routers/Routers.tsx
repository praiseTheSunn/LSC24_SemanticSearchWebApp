import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Home from '../pages/Home/home'
import React from 'react'
const Routers = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  )
}

export default Routers
