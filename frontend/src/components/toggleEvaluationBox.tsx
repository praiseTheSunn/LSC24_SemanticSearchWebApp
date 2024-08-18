// src/ToggableComponent.js
import React, { useState } from 'react'
import EvaluationBox from './evaluationBox'
import { Spin as Hamburger } from 'hamburger-react'

const ToggableComponent = () => {
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => {
    console.log('toggleVisibility')
    setIsVisible(!isVisible)
  }

  // const styles = {
  //   hamburgerBefore: {
  //     content: '""',
  //     position: 'absolute',
  //     top: 0,
  //     left: 0,
  //     right: 0,
  //     bottom: 0,
  //     borderRadius: '20px',
  //     background: 'linear-gradient(to right, #da2287, #f953c6)',
  //     transform: 'rotate(0deg)',
  //     transition: 'all 0.4s cubic-bezier(0.54, -0.10, 0.57, 0.57)',
  //   },
  //   firstLine: {
  //     width: '50%',
  //   },
  //   thirdLine: {
  //     width: '50%',
  //     marginLeft: '50%',
  //     transformOrigin: 'left',
  //   },
  //   itemListVisible: {
  //     transform: 'translateX(-50%) scale(1)',
  //     borderRadius: '20px',
  //     opacity: 1,
  //     userSelect: 'auto',
  //   },
  //   secondLineChecked: {
  //     transform: 'rotate(-45deg)',
  //   },
  //   firstLineChecked: {
  //     transform: 'translate(2px, 8px) rotate(-135deg)',
  //   },
  //   thirdLineChecked: {
  //     transform: 'translate(11px, -3px) rotate(-135deg)',
  //   },
  //   hamburgerBeforeChecked: {
  //     transform: 'rotate(45deg)',
  //   },
  // };

  // const [isClicked, setIsClicked] = useState(false)

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
  //   <React.Fragment>
  //     <style>
  //       {`
  //         svg {
  //           width: 50px;
  //           height: 40px;
  //         }

  //         #top-line,
  //         #bottom-line,
  //         #middle-line {
  //           transform-box: fill-box;
  //           transform-origin: center;
  //         }
  //         ${
  //           isVisible
  //             ? ` svg {
  //           #top-line {
  //             animation: down-rotate 0.6s ease-out both;
  //           }
  //           #bottom-line {
  //             animation: up-rotate 0.6s ease-out both;
  //           }
  //           #middle-line {
  //             animation: hide 0.6s ease-out forwards;
  //           }
  //         }`
  //             : ''
  //         }
         
          
  //         @keyframes up-rotate {
  //           0% {
  //             animation-timing-function: cubic-bezier(0.16, -0.88, 0.97, 0.53);
  //             transform: translateY(0px);
  //           }
  //           30% {
  //             transform-origin: center;
  //             animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
  //             transform: translateY(-10px);
  //           }
  //           100% {
  //             transform-origin: center;
  //             transform: translateY(-10px) rotate(45deg) scale(0.9);
  //           }
  //         }
          
  //         @keyframes down-rotate {
  //           0% {
  //             animation-timing-function: cubic-bezier(0.16, -0.88, 0.97, 0.53);
  //             transform: translateY(0px);
  //           }
  //           30% {
  //             transform-origin: center;
  //             animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
  //             transform: translateY(10px);
  //           }
  //           100% {
  //             transform-origin: center;
  //             transform: translateY(10px) rotate(-45deg) scale(0.9);
  //           }
  //         }
          
  //         @keyframes hide {
  //           29% {
  //             opacity: 1;
  //           }
  //           30% {
  //             opacity: 0;
  //           }
  //           100% {
  //             opacity: 0;
  //           }
  //         }
  //         `}
  //     </style>
  //     {/* <button onClick={toggleVisibility} className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500  ring-2 ring-blue-500">
  //       {isVisible ? 'Hide' : 'Show'} Login
  //     </button> */}
  //     <div
  //       className="fixed top-5 right-5 w-10"
  //       onClick={toggleVisibility}
  //       onKeyDown={toggleVisibility}
  //       onKeyUp={toggleVisibility}
  //       onKeyPress={toggleVisibility}
  //     >
  //       <svg id="hamburger" className="Header__toggle-svg" viewBox="0 0 60 40">
  //         <title>Toggle Evaluation Box</title>
  //         <g
  //           stroke="#138BC3"
  //           strokeWidth="4"
  //           strokeLinecap="round"
  //           strokeLinejoin="round"
  //         >
  //           <path id="top-line" d="M10,10 L50,10 Z" />
  //           <path id="middle-line" d="M10,20 L50,20 Z" />
  //           <path id="bottom-line" d="M10,30 L50,30 Z" />
  //         </g>
  //       </svg>
  //     </div>
  //     {isVisible && (
  //       <div
  //         className="fixed w-50 top-14 right-5 mt-2 w-full rounded-md shadow-lg p-2 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
  //         style={{ zIndex: 9999 }}
  //       >
  //         <EvaluationBox />
  //       </div>
  //     )}
  //   </React.Fragment>
}

export default ToggableComponent
