// import React, { useEffect, useState, useContext } from 'react'
// import { toast } from 'react-toastify'
// // import evalService from '../services/evalService'
// import { appActions, evaluationActions, useAppDispatch } from '../AppState'
// import { useCallback } from 'react'
// import { useSelector } from 'react-redux'
// import { isNil } from 'lodash'
// import type { EvaluationState } from '../types/app'

// const EvaluationBox = () => {

//   const [text, setText] = useState('')

//   const [loginState, setLoginState] = useState('Login')

//   const dispatch = useAppDispatch()
//   const isEvaluationIdNull = useSelector((state: EvaluationState) => state.evaluationId, isNil)

//   const evaluationId = useSelector((state: EvaluationState) => state.evaluationId)
//   const username = useSelector((state: EvaluationState) => state.username)
//   const password = useSelector((state: EvaluationState) => state.password)

//   const setEvaluationId = useCallback((evaluationId : string) => {
//     dispatch(evaluationActions.setEvaluationId(evaluationId))
//   }, [dispatch])
//   const setUsername = useCallback((username: string) => {
//     dispatch(evaluationActions.setUsername(username))
//   }, [dispatch])
//   const setPassword = useCallback((password: string) => {
//     dispatch(evaluationActions.setPassword(password))
//   }, [dispatch])

//   useEffect(() => {
//     const session = localStorage.getItem('session')
//     const username = localStorage.getItem('username')
//     const password = localStorage.getItem('password')
//     if (session && username && password) {
//       setLoginState('Logout')
//     }
//     if (username) {
//       setUsername(username)
//     }
//     if (password) {
//       setPassword(password)
//     }
//   }, [setPassword, setUsername])

//   return (
//     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', width: 'auto', height: 'auto', backgroundColor: 'white', padding: '8px', borderRadius: '8px' }}>
//       <input
//         type="text"
//         placeholder="Username"
//         style={{ gridColumn: 'span 1', borderRadius: '8px', paddingLeft: '8px', backgroundColor: '#CBD5E1' }}
//         value={username}
//         onChange={(e) => setUsername(e.target.value)}
//       />
//       <input
//         type="password"
//         placeholder="Password"
//         style={{ gridColumn: 'span 1', borderRadius: '8px', paddingLeft: '8px', backgroundColor: '#CBD5E1' }}
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//       />
//       <button
//         type="button"
//         style={{ gridColumn: 'span 1', borderRadius: '8px', paddingLeft: '8px', backgroundColor: '#64748B', color: '#FFFFFF' }}
//       >
//         {loginState}
//       </button>
//       <input
//         type="text"
//         placeholder="Evaluation ID"
//         style={{ gridColumn: 'span 3', borderRadius: '8px', paddingLeft: '8px', zIndex: 100, backgroundColor: '#CBD5E1' }}
//         value={evaluationId ?? ''}
//         onChange={(e) => setEvaluationId(e.target.value)}
//       />
//       <input
//         type="text"
//         placeholder="Text"
//         style={{ gridColumn: 'span 2', borderRadius: '8px', paddingLeft: '8px', backgroundColor: '#CBD5E1' }}
//         value={text}
//         onChange={(e) => setText(e.target.value)}
//       />
//       <button
//         type="button"
//         style={{ gridColumn: 'span 1', borderRadius: '8px', paddingLeft: '8px', backgroundColor: '#64748B', color: '#FFFFFF' }}
//       >
//         Submit text
//       </button>
//     </div>
//   )
// }

// export default EvaluationBox

import { Box, Button, Paper, TextField } from '@mui/material'
import { isNil, set } from 'lodash'
import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { appActions, evaluationActions, useAppDispatch } from '../AppState'
import type { EvaluationState } from '../types/app'
import { useLazyGetSessionIDQuery, useLazyGetEvalIDQuery, useQuestionAnsweringMutation, useKISAnsweringMutation } from '../AppState'
import { toast } from 'react-toastify'

const EvaluationBox = () => {
  const [text, setText] = useState('')
  const [loginState, setLoginState] = useState('Login')

  const [trigger, result] = useLazyGetSessionIDQuery()
  const [triggerEval, resultEval] = useLazyGetEvalIDQuery()
  const [triggerQA, resultQA] = useQuestionAnsweringMutation()
  // const [triggerKIS, resultKIS] = useKISAnsweringMutation()
  const dispatch = useAppDispatch()

  const username = useSelector((state: any) => state.evaluation.username)
  const password = useSelector((state: any) => state.evaluation.password)

  const setEvaluationId = useCallback(
    (evaluationId: string) => {
      dispatch(evaluationActions.setEvaluationId(evaluationId))
    },
    [dispatch],
  )

  const setSessionId = useCallback(
    (sessionId: string) => {
      dispatch(evaluationActions.setSessionId(sessionId))
    },
    [dispatch],
  )

  const setUsername = useCallback(
    (username: string) => {
      dispatch(evaluationActions.setUsername(username))
    },
    [dispatch],
  )

  const setPassword = useCallback(
    (password: string) => {
      dispatch(evaluationActions.setPassword(password))
    },
    [dispatch],
  )

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
  }, [setPassword, setUsername])

  useEffect(() => {
    if (result.data) {
      console.log("session here")
      triggerEval({ session: result.data })
      setSessionId(result.data)
    }
  }, [result.data])

  useEffect(() => {
    if (resultEval.data) {
      console.log("evaluation here")
      setEvaluationId(resultEval.data[2])
    }
  }, [resultEval.data])

  useEffect(() => {
    if (resultQA.data) {
      console.log(resultQA.data.submission)
    }
  }, [resultQA.data])

  // useEffect(() => {
  //   if (resultKIS.data) {
  //     console.log(resultKIS.data.submission)
  //   }
  // }, [resultKIS.isFetching])

  const GetSessionID = () => {
    if (loginState === 'Login') {
      console.log("This is", username, password)
      trigger({ username: username, password: password })
      setLoginState('Logout')
    } else {
      setLoginState('Login')
    }
  }

  const SubmitText = () => {
    if(resultEval.data && result.data){
      triggerQA({ evaluation_id: resultEval.data[2], session: result.data, text: text })

      toast.success(`Submitted with awser ${text}`, {
        position: 'bottom-right',
        autoClose: 5000,
        closeOnClick: true,
      })
      // triggerKIS({ evaluation_id: resultEval.data, session: result.data, mediaItemName: "L03_V006", start: 891500, end: 891500 })
    }
  }

  return (
    <Paper
      elevation={4}
      sx={{
        // width: '100%',
        width: '500px',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 2,
        p: 2,
        backgroundColor: 'white',
        borderRadius: 2,
      }}
    // style={{ position: 'absolute', top: '90px', right: '0px' }}
    >
      <TextField
        label="Username"
        variant="outlined"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        sx={{ gridColumn: 'span 1' }}
        size="small"
      />
      <TextField
        label="Password"
        type="password"
        variant="outlined"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        sx={{ gridColumn: 'span 1' }}
        size="small"
      />
      <Button
        variant="contained"
        color="primary"
        sx={{ gridColumn: 'span 1' }}
        size="small"
        onClick={GetSessionID}
      >
        {loginState}
      </Button>
      {/* <TextField
        label="Evaluation ID"
        variant="outlined"
        value={evaluationId ?? ''}
        onChange={(e) => setEvaluationId(e.target.value)}
        sx={{ gridColumn: 'span 3' }}
        size="small"
      /> */}
      <TextField
        label="Text"
        variant="outlined"
        value={text}
        onChange={(e) => setText(e.target.value)}
        sx={{ gridColumn: 'span 2' }}
        size="small"
      />
      <Button
        variant="contained"
        color="primary"
        sx={{ gridColumn: 'span 1' }}
        size="small"
        onClick={SubmitText}
      >
        Submit Text
      </Button>
    </Paper>
  )
}

export default EvaluationBox
