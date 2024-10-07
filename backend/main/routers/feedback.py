from fastapi import APIRouter, status, HTTPException, Depends
from fastapi.responses import JSONResponse
from internal.feedback import relevant
from schemas.request_schemas import RequestFeedbackRelevant
from schemas.response_schemas import ResponseURLs

router = APIRouter(
    prefix = '/feedback',
    tags = ['feedback'],
)

@router.post("/like")
async def get_relevant_images(data: RequestFeedbackRelevant):
    print(data.image_urls)
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    response = await relevant.get_relevant_images(data)
    return JSONResponse(content={"response": response}, headers=header)
