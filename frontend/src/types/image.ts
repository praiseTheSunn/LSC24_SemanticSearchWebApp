import type { ObjPosResponse } from "./api"


export type ImageRecord = ObjPosResponse

export type VisibilityType = 'visible' | 'hidden' | 'collapse';

export type TimelineTabActivityData = {
    activity_id: number
    activity: string
    images: ImageRecord[]
}
export type TimelineTabActivityRowData = TimelineTabActivityData[]
export type TimelineTabActivityAllData = Map<string, TimelineTabActivityRowData>


export type TimelineTabLocationData = {
    location_id: number
    location: string
    images: ImageRecord[]
}
export type TimelineTabLocationRowData = TimelineTabLocationData[]
export type TimelineTabLocationAllData = Map<string, TimelineTabLocationRowData>