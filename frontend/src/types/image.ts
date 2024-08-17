import type { ObjPosResponse } from "../services/interface";

export type ImageRecord = ObjPosResponse

export type VisibilityType = 'visible' | 'hidden' | 'collapse';

export type TimelineTabActivityData = {
    activity_id: number
    activity: string
    images: ImageRecord[]
}

export type TimelineTabLocationData = {
    location_id: number
    location: string
    images: ImageRecord[]
}

export type TimelineTabActivityRowData = {
    [key: string]: TimelineTabActivityData[]
}

export type TimelineTabLocationRowData = {
    [key: string]: TimelineTabLocationData[]
}
