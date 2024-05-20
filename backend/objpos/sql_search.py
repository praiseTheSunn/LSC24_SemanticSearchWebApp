from fastapi import FastAPI, Depends, Query
from typing import List, Dict, Optional
from pydantic import BaseModel
import aiosqlite
from fastapi.middleware.cors import CORSMiddleware
import math

app = FastAPI()

# Allow CORS for all origins, or specify your desired origins
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:3000"
    # Add more origins if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

DATABASE_URL = "joined_data.db"

class ObjectData(BaseModel):
    object_name: str
    top_left_x: float
    top_left_y: float
    bottom_right_x: float
    bottom_right_y: float

class ImageScore(BaseModel):
    img_link: str
    score: float
    date: str
    time: str
    ocr: str
    caption: str
    location: str
    activity: str 
    new_lat: Optional[float]  # Allow None
    new_lng: Optional[float]  # Allow None

class Database:
    def __init__(self, db_url):
        self.db_url = db_url
        self.pool = None

    async def get_connection(self):
        if not self.pool:
            self.pool = await aiosqlite.connect(self.db_url)
        return self.pool

    async def close(self):
        if self.pool:
            await self.pool.close()

db = Database(DATABASE_URL)

@app.on_event("startup")
async def startup():
    await db.get_connection()

@app.on_event("shutdown")
async def shutdown():
    await db.close()

def calculate_intersection_area(x1, y1, x2, y2, x3, y3, x4, y4):
    inter_width = min(x2, x4) - max(x1, x3)
    inter_height = min(y2, y4) - max(y1, y3)
    if inter_width > 0 and inter_height > 0:
        return inter_width * inter_height / ((x3 - x4) * (y3 - y4)) # intersection area / total area of the groundtruth
    return 0

@app.post('/obj/positioning', response_model=List[ImageScore])
async def search_images(objects: List[ObjectData], limit: int = 1000):
    conn = await db.get_connection()
    cursor = await conn.cursor()
    
    image_scores = {}

    for obj in objects:
        await cursor.execute('''SELECT filepath, top_left_x, top_left_y, bottom_right_x, bottom_right_y, 
                                       date, time, location, new_lat, new_lng, caption, ocr, activity
                                FROM joined_data
                                WHERE object_name = ? AND
                                top_left_x <= ? AND bottom_right_x >= ? AND
                                top_left_y <= ? AND bottom_right_y >= ?''',
                             (obj.object_name, obj.bottom_right_x, obj.top_left_x,
                              obj.bottom_right_y, obj.top_left_y))
        
        all_images = await cursor.fetchall()
        
        for image in all_images:
            filepath = image[0]
            top_left_x_db = image[1]
            top_left_y_db = image[2]
            bottom_right_x_db = image[3]
            bottom_right_y_db = image[4]
            area = calculate_intersection_area(obj.top_left_x, obj.top_left_y, obj.bottom_right_x, obj.bottom_right_y,
                                               top_left_x_db, top_left_y_db, bottom_right_x_db, bottom_right_y_db)
            if area > 0:
                if filepath not in image_scores:
                    image_scores[filepath] = {
                        "score": 0,
                        "date": image[5],
                        "time": image[6],
                        "location": image[7],
                        "new_lat": image[8] if image[8] is not None and not math.isnan(image[8]) else None,
                        "new_lng": image[9] if image[9] is not None and not math.isnan(image[9]) else None,
                        "caption": image[10],
                        "ocr": image[11],
                        "activity": image[12]
                    }
                image_scores[filepath]["score"] += area
    
    # Sort images by their total score in descending order
    sorted_images = sorted(image_scores.items(), key=lambda x: x[1]["score"], reverse=True)
    
    # Limit the results to the specified number
    matching_images = [{
        "img_link": img[0],
        "score": img[1]["score"],
        "date": img[1]["date"],
        "time": img[1]["time"],
        "location": img[1]["location"],
        "new_lat": img[1]["new_lat"],
        "new_lng": img[1]["new_lng"],
        "caption": img[1]["caption"],
        "ocr": img[1]["ocr"],
        "activity": img[1]["activity"]
    } for img in sorted_images[:limit]]
    
    return matching_images

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
