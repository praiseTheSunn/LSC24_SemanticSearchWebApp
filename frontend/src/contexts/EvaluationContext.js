import React, { createContext, useState } from 'react';

export const EvaluationContext = createContext();

export const EvaluationContextProvider = ({ children }) => {
  const [evaluationId, setEvaluationId] = useState('');

  return (
    <EvaluationContext.Provider value={{ evaluationId, setEvaluationId }}>
      {children}
    </EvaluationContext.Provider>
  );
};
