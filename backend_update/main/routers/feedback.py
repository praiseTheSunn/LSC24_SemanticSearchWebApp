from fastapi import APIRouter, status, HTTPException, Depends
from fastapi.responses import JSONResponse
from internal.feedback import feedback
from internal.postprocess import prepare_response
from schemas.request_schemas import RequestFeedback
from schemas.response_schemas import ResponseURLs

router = APIRouter(
    prefix = '/feedback',
    tags = ['feedback'],
)

@router.post("")
async def get_feedback(payload: RequestFeedback):
    header = {
        'Access-Control-Allow-Origin': '*'
    }
    data_like = {
        "record_ids": payload.like.ids,
        "prior_scores": payload.like.prior_scores,
        "limit": payload.like.limit,
        "model": payload.model,
        "dataset": payload.dataset
    }
    data_dislike = {
        "record_ids": payload.dislike.ids,
        "limit": payload.dislike.limit,
        "model": payload.model,
        "dataset": payload.dataset
    }
    response_relevant = await feedback.get_relevant_images(**data_like)
    response_irrelevant = await feedback.get_irrelevant_images(**data_dislike)
    response = {
        "like": await prepare_response(payload.dataset, payload.model, response_relevant["record_ids"], display_window_size=0),
        "dislike": await prepare_response(payload.dataset, payload.model, response_irrelevant["record_ids"], display_window_size=0)
    }
    return JSONResponse(content={"response": response}, status_code=status.HTTP_200_OK, headers=header)
