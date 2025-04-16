from pydantic import BaseModel

class ResponseURLs(BaseModel):
    response: dict

    class Config:
        json_schema_extra = {
            "example": [
                {
                    "img_link": "http://34.124.236.208/img_lsc/201903/15/20190315_130858_000.webp",
                    "date": "2019-08-01",
                    "time": "01:37",
                    "location": "HOME   Bangkok, Thailand",
                    "activity": "Breakfast",
                    "caption": "Breakfast with my family",
                    "ocr": "IRELAND GUINNESS",
                    "new_lat": 53.385635,
                    "new_lng": -6.256353,
                    "score": 200
                },
                {
                    "img_link": "http://34.124.236.208/img_lsc/201903/15/20190315_130858_000.webp",
                    "date": "2019-08-01",
                    "time": "01:37",
                    "location": "HOME   Bangkok, Thailand",
                    "activity": "Breakfast",
                    "caption": "Breakfast with my family",
                    "ocr": "IRELAND GUINNESS",
                    "new_lat": 53.385635,
                    "new_lng": -6.256353,
                    "score": 200
                },
                {
                    "img_link": "http://34.124.236.208/img_lsc/201903/15/20190315_130858_000.webp",
                    "date": "2019-08-01",
                    "time": "01:37",
                    "location": "HOME   Bangkok, Thailand",
                    "activity": "Breakfast",
                    "caption": "Breakfast with my family",
                    "ocr": "IRELAND GUINNESS",
                    "new_lat": 53.385635,
                    "new_lng": -6.256353,
                    "score": 200
                }
            ]
        }

class ResponseEmbeddings(BaseModel):
    embeddings: list[list[float]]

    class Config:
        json_schema_extra = {
            "example": {
                "embeddings": [
                    [0.1, 0.2, 0.3],
                    [0.4, 0.5, 0.6],
                    [0.7, 0.8, 0.9],
                ]
            }
        }