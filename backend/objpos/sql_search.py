from fastapi import FastAPI, Depends, Query
from typing import List, Dict
from pydantic import BaseModel
import aiosqlite

app = FastAPI()

DATABASE_URL = "image_data.db"

class ObjectData(BaseModel):
    object_name: str
    top_left_x: float
    top_left_y: float
    bottom_right_x: float
    bottom_right_y: float

class ImageScore(BaseModel):
    filename: str
    score: float
    date: str
    time: str

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
        return inter_width * inter_height
    return 0

@app.post('/obj/positioning', response_model=List[ImageScore])
async def search_images(objects: List[ObjectData], limit: int = 1000):
    conn = await db.get_connection()
    cursor = await conn.cursor()
    
    image_scores = {}

    for obj in objects:
        await cursor.execute('''SELECT filename, top_left_x, top_left_y, bottom_right_x, bottom_right_y FROM images
                                WHERE object_name = ? AND
                                top_left_x <= ? AND bottom_right_x >= ? AND
                                top_left_y <= ? AND bottom_right_y >= ?''',
                             (obj.object_name, obj.bottom_right_x, obj.top_left_x,
                              obj.bottom_right_y, obj.top_left_y))
        
        all_images = await cursor.fetchall()
        
        for image in all_images:
            filename = image[0]
            top_left_x_db = image[1]
            top_left_y_db = image[2]
            bottom_right_x_db = image[3]
            bottom_right_y_db = image[4]
            area = calculate_intersection_area(obj.top_left_x, obj.top_left_y, obj.bottom_right_x, obj.bottom_right_y,
                                               top_left_x_db, top_left_y_db, bottom_right_x_db, bottom_right_y_db)
            if area > 0:
                if filename not in image_scores:
                    image_scores[filename] = 0
                image_scores[filename] += area
    
    # Sort images by their total score in descending order
    sorted_images = sorted(image_scores.items(), key=lambda x: x[1], reverse=True)
    
    # Limit the results to the specified number
    matching_images = [{"filename": img[0], "score": img[1]} for img in sorted_images[:limit]]
    
    return matching_images

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=8000)
