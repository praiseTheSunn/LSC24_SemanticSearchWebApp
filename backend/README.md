## How to run the server

0. Change root directory to backend/

1. Use this to run the backend.
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

2. Wait until the server has finished setting up (see in command line). This can take a while.

3. Access this to see the API documents
http://127.0.0.1:8000/docs