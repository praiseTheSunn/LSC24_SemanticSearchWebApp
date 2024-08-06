import eval_http from './eval-common'

const getEvaluationId = (sesId) => {
  return eval_http.get(
    `/api/v2/client/evaluation/list?session=${sesId}`,
    // , {headers: { 'Cookie': `SESSIONID=${sesId}` } });
  )
}

const login = (username, password) => {
  return eval_http.post('/api/v2/login', {
    username: username,
    password: password,
  })
}

const submitFile = (evaluationId, sesId, fileName) => {
  return eval_http.post(`/api/v2/submit/${evaluationId}?session=${sesId}`, {
    answerSets: [
      {
        answers: [
          {
            mediaItemName: fileName,
          },
        ],
      },
    ],
  })
  // , { headers: { 'SESSIONID': sesId } });
}

const submitText = (evaluationId, sesId, text) => {
  return eval_http.post(`/api/v2/submit/${evaluationId}?session=${sesId}`, {
    answerSets: [
      {
        answers: [
          {
            text: text,
          },
        ],
      },
    ],
  })
}

const evalService = {
  getEvaluationId,
  login,
  submitFile,
  submitText,
}

export default evalService
