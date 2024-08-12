export type ImageRecord = {
    id: number
    img_link: string
    date: string
    time: string
    score: number
    location_id: number
    location_displayed: string
    activity_id: number
    activity: string
}

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
