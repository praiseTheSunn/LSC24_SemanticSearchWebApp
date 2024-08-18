import React, { useEffect, useRef, useState } from 'react'
import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  List,
} from 'react-virtualized'
import {
  ActivityIcon,
  ActivityIconActive,
  LocationIcon,
  LocationIconActive,
} from '../../assets'
import { KhangScrollBar, TimelineTab } from '../../components'
import { ImageGroup } from '../../components'
import { ImageSingle } from '../../components'
import ActivityBar from '../../components/activityBar'
import type { ImageRecord } from '../../types/image'

// const imageUrl = "https://www.yourcelebritymagazines.com/cdn/shop/files/A360_TAYLORSWIFT_TTPD_COV_APR_2024_V2_80_copy_1800x1800_1602402a-efde-486d-b22b-bc1c6bd7cfa5.webp?v=1713265674"

const LocationTimeline = ({ data } : { data: ImageRecord[] }) => {
  return (
    // const [selectedDate, setSelectedDate] = useState<string | null>(null)
    <TimelineTab/>
  )
}

export default LocationTimeline
