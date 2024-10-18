import { Box, Button, Paper, TextField } from '@mui/material'
import { isNil, result, set } from 'lodash'
import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { appActions, evaluationActions, useAppDispatch } from '../AppState'
import type { EvaluationState } from '../types/app'
import { useLazyGetSessionIDQuery, useLazyGetEvalIDQuery, useQuestionAnsweringMutation, useKISAnsweringMutation } from '../AppState'
import { toast } from 'react-toastify'
import {displayResponseToast} from '../utils/evaluation/displayResponseToast'

const EvaluationBox = () => {
  const [text, setText] = useState('')

  const [triggerSessionID, resultSessionID] = useLazyGetSessionIDQuery()
  const [triggerEval, resultEval] = useLazyGetEvalIDQuery()
  const [triggerQA, resultQA] = useQuestionAnsweringMutation()

  const username = localStorage.getItem('username') ?? ''
  const password = localStorage.getItem('password') ?? ''
  const evaluationId = localStorage.getItem('evaluationId') ?? ''
  const sessionId = localStorage.getItem('sessionId') ?? ''

  const [loginState, setLoginState] = useState( isNil(sessionId) ? 'Login' : 'Logout')

  // const [triggerKIS, resultKIS] = useKISAnsweringMutation()
  const dispatch = useAppDispatch()

  const setEvaluationId = useCallback(
    (evaluationId: string) => {
      localStorage.setItem('evaluationId', evaluationId)
    },
    [],
  )

  const setSessionId = useCallback(
    (sessionId: string) => {
      localStorage.setItem('sessionId', sessionId)
    },
    [],
  )

  const setUsername = useCallback(
    (username: string) => {
      localStorage.setItem('username', username)
    },
    [],
  )

  const setPassword = useCallback(
    (password: string) => {
      localStorage.setItem('password', password)
    },
    [],
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

  const GetSessionID = async () => {
    if (loginState === 'Login') {
      console.log("This is", username, password)
      const response = await triggerSessionID({ username: username, password: password })
      if (!response.data) {
        toast.error('Invalid username or password', {
          position: 'bottom-right',
          autoClose: 5000,
          closeOnClick: true,
        })
        return
      }

      setSessionId(response.data)

      const reponseEval = await triggerEval({ session: response.data })
      if (!reponseEval.data) {
        toast.error('Invalid session id', {
          position: 'bottom-right',
          autoClose: 5000,
          closeOnClick: true,
        })
        return
      }

      // DE SAI O DAY
      setEvaluationId(reponseEval.data[2])
      
      setLoginState('Logout')
    } else {
      setLoginState('Login')
    }
  }

  const SubmitText = async () => {
    if (!evaluationId || !sessionId) {
      return
    }

    // Kiểm tra text có dạng "answer-Lxx_Vxxx-ms" không với answer khác chuỗi rỗng, x có dạng số, ms có dạng số
    const regex = /^[^\s]+-L\d{2}_V\d{3}-\d+$/

    if (!regex.test(text)) {
      toast.error('Text is not in the correct format, must be answer-Lxx_Vxxx-ms', {
        position: 'bottom-right',
        autoClose: 2000,
        closeOnClick: true,
      })
      return
    }

      // triggerQA({ evaluation_id: evaluationId[0], session: result.data, text: text })
    const resultQA = await triggerQA({ evaluation_id: evaluationId, session: sessionId, text: text })
    displayResponseToast(resultQA)
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
        defaultValue={username}
        onChange={(e) => setUsername(e.target.value)}
        sx={{ gridColumn: 'span 1' }}
        size="small"
      />
      <TextField
        label="Password"
        type="password"
        variant="outlined"
        defaultValue={password}
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
      <TextField
        label="Evaluation ID"
        variant="outlined"
        value={evaluationId ?? 'NONE'}
        // onChange={(e) => setEvaluationId(e.target.value)}
        sx={{ gridColumn: 'span 3' }}
        size="small"
        InputProps={{
          readOnly: true,
        }}
      />
      <TextField
        label="Session ID"
        variant="outlined"
        value={sessionId ?? 'NONE'}
        // onChange={(e) => setEvaluationId(e.target.value)}
        sx={{ gridColumn: 'span 3' }}
        size="small"
        InputProps={{
          readOnly: true,
        }}
      />
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
