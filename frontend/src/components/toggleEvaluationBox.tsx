import { Spin as Hamburger } from 'hamburger-react'
// src/ToggableComponent.js
import React, { useState } from 'react'
import EvaluationBox from './evaluationBox'

const ToggableComponent = () => {
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => {
    console.log('toggleVisibility')
    setIsVisible(!isVisible)
  }

  return (
    <div>
      <Hamburger
        size={30}
        color="#000"
        label="Show menu"
        onToggle={toggleVisibility}
      />
      {isVisible && <EvaluationBox />}
    </div>
  )
}

export default ToggableComponent
