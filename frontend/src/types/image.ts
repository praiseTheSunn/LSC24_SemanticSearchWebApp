import type { ObjPosResponse } from "../services/interface";

export type ImageRecord = ObjPosResponse

export type VisibilityType = 'visible' | 'hidden' | 'collapse';

export type TimelineTabActivityData = {
    // activity_id: number
    activity: string
    images: ImageRecord[]
}
export type TimelineTabActivityRowData = Map<number, TimelineTabActivityData>
export type TimelineTabActivityAllData = Map<string, TimelineTabActivityRowData>


export type TimelineTabLocationData = {
    // location_id: number
    location: string
    images: ImageRecord[]
}
export type TimelineTabLocationRowData = Map<number, TimelineTabLocationData>
export type TimelineTabLocationAllData = Map<string, TimelineTabLocationRowData>