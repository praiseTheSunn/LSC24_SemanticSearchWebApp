from fastapi import APIRouter, status, HTTPException, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from internal.search import search
from schemas.request_schemas import RequestSearchByTextQuery, RequestSearchByImageQuery
from schemas.response_schemas import ResponseURLs
from schemas import options_schemas
import base64


router = APIRouter(
    prefix = '/search',
    tags = ['search'],
)


@router.post("/search_with_image_query", response_model=ResponseURLs)
async def search_with_image_query(payload: RequestSearchByImageQuery):
    headers = {
        'Access-Control-Allow-Origin': '*'
    }

    response_data, response_status = search.search_with_image_query(payload)
    if response_status == 200:
        data = {
            "status": response_status,
            "message": "Data retrieved successfully",
            "data": response_data
        }
    else:
        data = {
            "status": response_status,
            "message": "Data retrieval failed",
            "error": response_data
        }
    return JSONResponse(content=data, status_code=response_status, headers=headers)


@router.post("/search_with_text_query", response_model=ResponseURLs)
async def search_with_text_query(payload: RequestSearchByTextQuery):
    headers = {
        'Access-Control-Allow-Origin': '*'
    }
    response_data, response_status = search.search_with_text_query(payload)
    if response_status == 200:
        data = {
            "status": response_status,
            "message": "Data retrieved successfully",
            "data": response_data
        }
    else:
        data = {
            "status": response_status,
            "message": "Data retrieval failed",
            "error": response_data
        }
    return JSONResponse(content=data, status_code=response_status, headers=headers)