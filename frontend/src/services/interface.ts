
export type ObjPosResponse = {
  img_link: string;
  score: number;
  date: string;
  time: string;
  ocr: string;
  caption: string;
  location: string;
  activity: string;
  new_lat?: number;
  new_lng?: number;  
  activity_id: number;
  event_id: number;
  location_id: number;
  object_tags: string;
  day_of_week: string;
  location_displayed: string;
}

export type ObjPosParams = {
  object_name: string;
  top_left_x: number;
  top_left_y: number;
  bottom_right_x: number;
  bottom_right_y: number;
}