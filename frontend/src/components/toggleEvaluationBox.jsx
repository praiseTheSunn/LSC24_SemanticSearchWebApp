// src/ToggableComponent.js
import React, { useState } from 'react';
import EvaluationBox from './evaluationBox';

const ToggableComponent = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div>
      <button onClick={toggleVisibility} className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        {isVisible ? 'Hide' : 'Show'} Login
      </button>
      {isVisible && (
        <div
        className="origin-top-right right-0 mt-2 w-full rounded-md shadow-lg p-2 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
        
        style={{ zIndex: 9999 }}
        >
        <EvaluationBox/>
        </div>
      )}
    </div>
  );
};

export default ToggableComponent;
