import React, { useState, useContext } from 'react';
import evalService from '../services/evalService';
import { EvaluationContext } from '../contexts/EvaluationContext';
import { toast } from 'react-toastify';

const EvaluationBox = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { evaluationId, setEvaluationId } = useContext(EvaluationContext);
  const [text, setText] = useState('');

  const [loginState, setLoginState] = useState("Login");

  const handleButtonClick = () => {
    evalService.login(username, password).then((response) => {
        console.log('response', response);
        localStorage.setItem('session', response.data.sessionId);
        setLoginState("Logout");
        toast.success('Login successful');
    }).catch((error) => {
        console.log('error logging', error);
        toast.error('Login failed');
    });
  };

  const handleButtonClickSubmitText = () => {
    evalService.submitText(evaluationId, localStorage.getItem('session'), text).then((response) => {
        console.log('response', response);
    }).catch((error) => {
        console.log('error submitting text', error);
    });
  }

  return (
    <div className="grid grid-cols-3 gap-2 w-auto h-auto">
      {/* <div className=" "> */}
        <input
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
        />
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
  );
};

export default EvaluationBox;
