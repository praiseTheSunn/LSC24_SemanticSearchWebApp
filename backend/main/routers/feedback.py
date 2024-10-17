from fastapi import APIRouter, status, HTTPException, Depends
from fastapi.responses import JSONResponse
from internal.feedback import feedback
from schemas.request_schemas import RequestFeedback, RequestFeedbackRelevant, RequestFeedbackIrrelevant
from schemas.response_schemas import ResponseURLs

router = APIRouter(
    prefix = '/feedback',
    tags = ['feedback'],
)

@router.post("")
async def get_feedback(data: RequestFeedback):
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    data_like = {
        "text_query": data.like.text_query,
        "image_urls": data.like.image_urls,
        "limit": data.like.limit,
        "model": data.model,
        "dataset": data.dataset
    }
    data_dislike = {
        "image_urls": data.dislike.image_urls,
        "limit": data.dislike.limit,
        "model": data.model,
        "dataset": data.dataset
    }
    response_relevant = await feedback.get_relevant_images(data_like)
    response_irrelevant = await feedback.get_irrelevant_images(data_dislike)
    response = {
        "like": response_relevant,
        "dislike": response_irrelevant
    }
    return JSONResponse(content={"response": response}, headers=header)

# @router.post("/like", response_model=ResponseURLs)
# async def get_relevant_images(data: RequestFeedbackRelevant):
#     header = {
#         'Access-Control-Allow-Origin': '*'
#     }
#     response = await feedback.get_relevant_images(data)
#     return JSONResponse(content={"response": response}, headers=header)

# @router.post("/dislike", response_model=ResponseURLs)
# async def get_irrelevant_images(data: RequestFeedbackIrrelevant):
#     header = {
#         'Access-Control-Allow-Origin': '*'
#     }
#     response = await feedback.get_irrelevant_images(data)
#     return JSONResponse(content={"response": response}, headers=header)
