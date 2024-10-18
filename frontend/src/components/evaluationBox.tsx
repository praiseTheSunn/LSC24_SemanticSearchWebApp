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
      // setEvaluationId(resultEval.data[0])
      setEvaluationId(resultEval.data[2])

    }
  }, [resultEval.data])

  useEffect(() => {
    console.log('QA result:', resultQA); // In ra response khi có dữ liệu
    if (resultQA && resultQA.data) {
      console.log('QA result:', resultQA.data); // In ra response khi có dữ liệu
      if (resultQA.data.status === true && resultQA.data.submission == "CORRECT") {
        toast.success('Submission CORRECT', {
          position: 'bottom-right',
          autoClose: 2000,
        })
      }
      else if (resultQA.data.status === true && resultQA.data.submission == "WRONG") {
        toast.error('Submission WRONG', {
          position: 'bottom-right',
          autoClose: 2000,
        })
      }
      else {
        toast.error(`Submission FAILED ${resultQA.data.description}`, {
          position: 'bottom-right',
          autoClose: 2000,
        })
      }
    }
    if (resultQA && resultQA.isError) {
      // console.error('Error from KIS:', resultKIS.error); // In ra lỗi nếu có
      toast.error(`Submission FAILED - ERROR ${resultQA.error.data.description}`, {
        position: 'bottom-right',
        autoClose: 2000,
      })
    }
  }, [resultQA]);

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
    if (resultEval.data && result.data) {
      // Kiểm tra text có dạng "answer-Lxx_Vxxx-ms" không với answer khác chuỗi rỗng, x có dạng số, ms có dạng số
      const regex = /^[^\s]+-L\d{2}_V\d{3}-\d+$/

      if (!regex.test(text)) {
        toast.error('Text is not in the correct format, must be answer-Lxx_Vxxx-ms', {
          position: 'bottom-right',
          autoClose: 2000,
          closeOnClick: true,
        })
      }
      else {
        // triggerQA({ evaluation_id: resultEval.data[0], session: result.data, text: text })
        triggerQA({ evaluation_id: resultEval.data[2], session: result.data, text: text })

        toast.success(`Submitted with awser ${text}`, {
          position: 'bottom-right',
          autoClose: 2000,
          closeOnClick: true,
        })
        // triggerKIS({ evaluation_id: resultEval.data, session: result.data, mediaItemName: "L03_V006", start: 891500, end: 891500 })  
      }
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
