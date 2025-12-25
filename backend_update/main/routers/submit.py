from fastapi import APIRouter, status, HTTPException, Depends
from fastapi.responses import JSONResponse
from datetime import datetime
from schemas.request_schemas import RequestLogSubmit
from internal.logger import save_log
from dataset.dataset_manager import DatasetManager




router = APIRouter(
    prefix = '/submit',
    tags = ['submit'],
)


@router.post("")
async def submit(payload: RequestLogSubmit):
    inputs = payload.model_dump()

    save_log(
        log_path=f"./logs/{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}.json",
        interaction_type="SUBMIT",
        payload=payload,
        response=None
    )

    return JSONResponse(
        content={
            "status": status.HTTP_200_OK,
            "submission": "",
            "description": "Submission successful",
        }, 
        status_code=status.HTTP_200_OK,
        headers={'Access-Control-Allow-Origin': '*'}
    )     