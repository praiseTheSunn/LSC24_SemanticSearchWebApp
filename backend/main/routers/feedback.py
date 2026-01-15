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
        "ids": data.like.ids,
        "prior_scores": data.like.prior_scores,
        "limit": data.like.limit,
        "model": data.model,
        "dataset": data.dataset
    }
    data_dislike = {
        "ids": data.dislike.ids,
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
