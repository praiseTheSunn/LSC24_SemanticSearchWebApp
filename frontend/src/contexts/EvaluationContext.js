import React, { createContext, useState } from 'react'

export const EvaluationContext = createContext()

export const EvaluationContextProvider = ({ children }) => {
  const [evaluationId, setEvaluationId] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  return (
    <EvaluationContext.Provider
      value={{
        evaluationId,
        setEvaluationId,
        username,
        setUsername,
        password,
        setPassword,
      }}
    >
      {children}
    </EvaluationContext.Provider>
  )
}
