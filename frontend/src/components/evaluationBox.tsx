import React, { useEffect, useState, useContext } from 'react'
import { toast } from 'react-toastify'
import evalService from '../services/evalService'
import { appActions, evaluationActions, useAppDispatch } from '../AppState'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { isNil } from 'lodash'
import type { EvaluationState } from '../types/app'

const EvaluationBox = () => {
 
  const [text, setText] = useState('')

  const [loginState, setLoginState] = useState('Login')

  const dispatch = useAppDispatch()
  const isEvaluationIdNull = useSelector((state: EvaluationState) => state.evaluation.evaluationId, isNil)
  const setEvaluationId = useCallback((evaluationId) => {
    dispatch(evaluationActions.setEvaluationId(evaluationId))
  }, [dispatch])
  const setUsername = useCallback((username: string) => {
    dispatch(evaluationActions.setUsername(username))
  }, [dispatch])
  const setPassword = useCallback((password: string) => {
    dispatch(evaluationActions.setPassword(password))
  }, [dispatch])

  useEffect(() => {
    const session = localStorage.getItem('session')
    const username = localStorage.getItem('username')
    const password = localStorage.getItem('password')
    if (session && username && password) {
      setLoginState('Logout')
    }
    if (username) {
      setUsername(username)
    }
    if (password) {
      setPassword(password)
    }
  }, [])

  // const handleButtonClick = () => {
  //   evalService
  //     .login(username, password)
  //     .then((response) => {
  //       console.log('response', response)
  //       localStorage.setItem('session', response.data.sessionId)
  //       localStorage.setItem('username', username)
  //       localStorage.setItem('password', password)
  //       setLoginState('Logout')
  //       toast.success('Login successful')
  //       evalService
  //         .login('lscteam051', 'DWGg6wVM6PKMHVh')
  //         .then((response) => {
  //           console.log('response', response)
  //           localStorage.setItem('sessionCentral', response.data.sessionId)
  //           toast.success('Login CENTRAL successful')
  //         })
  //         .catch((error) => {
  //           console.log('error logging', error)
  //           toast.error('Login CENTRAL failed')
  //         })
  //     })
  //     .catch((error) => {
  //       console.log('error logging', error)
  //       toast.error('Login failed')
  //     })
  // }

  return (
    <div className="grid grid-cols-3 gap-2 w-auto h-auto">
      {/* <div className=" "> */}
      {/* <input
        type="text"
        placeholder="Username"
        className="col-span-1 rounded-lg pl-2 bg-slate-300"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="col-span-1 rounded-lg pl-2 bg-slate-300"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        type="button"
        onClick={handleButtonClick}
        className="col-span-1 rounded-lg pl-2 bg-slate-500 text-white"
      >
        {loginState}
      </button>
      <input
        type="text"
        placeholder="Evaluation ID"
        className="col-span-3 rounded-lg pl-2 z-100 bg-slate-300"
        value={evaluationId}
        onChange={(e) => setEvaluationId(e.target.value)}
      /> */}
      {/* <input
          type="text"
          placeholder="Text"
          className="col-span-2 rounded-lg pl-2 bg-slate-300"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
            type="button"
            onClick={handleButtonClickSubmitText}
          className="col-span-1 rounded-lg pl-2 bg-slate-500 text-white"
        > Submit text </button> */}
      {/* </div> */}
    </div>
  )
}

export default EvaluationBox
