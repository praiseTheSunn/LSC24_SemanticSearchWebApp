import { useEffect, useState } from 'react'
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'
import type { ImageRecord, VisibilityType, TimelineTabActivityRowData, TimelineTabActivityData } from '../types/image'
import type React from 'react'

interface Activity {
  images: ImageRecord[];
  [key: string]: any;         // To allow any other properties
}

interface ActivityBarProps {
  rowData: TimelineTabActivityRowData;
  visibility: VisibilityType;
  onActivitySelect: (activity_id: number | null) => void
}

// create a map from activity to color code
// const activityColorMap = {
//     "Breakfast": "#2f3f8f",
//     "Drive to work": "#228b22",
//     "Lecturing": "#ff0000",
//     "Dancing": "#ffff00",
// }

const activityColorMap: { [key: string]: string } = {
  'driving car': '#800000',
  'working on computer': '#9a6324',
  eating: '#808000',
  'doing laundry': '#469990',
  cooking: '#000075',
  biking: '#000000',
  'watching tv': '#911eb4',
  writing: '#3cb44b',
  shopping: '#ffe119',
  Other: '#f58231',
}

const ActivityBar: React.FC<ActivityBarProps> = ({ rowData, visibility, onActivitySelect }) => {
  // determine the width of each activity segment on the bar
  const rowDataArray: TimelineTabActivityData[] = Array.from(rowData.values())
  const imageCounts = rowDataArray.map((activity_item) => `${activity_item.images.length}`)
  const resultString = imageCounts.map((item) => `${item}fr`).join(' ')
  if (rowData) {
    for (const activity_item of rowDataArray) {
      activity_item.images.sort((a, b) => b.score - a.score)
    }
  }
  // console.log('data', data);
  const [bestImg, setBestImg] = useState(null)

  useEffect(() => {
    console.log('bestImg', bestImg)
  }, [bestImg])

  // xu ly viec click vao 1 activity nao do
  const [clickedIndex, setClickedIndex] = useState<number | null>(null)
  useEffect(() => {
    console.log('bestImg', bestImg)
  }, [bestImg])
  const handleActivityClick = (activity_id: number | null, bestImg: any, index: number | null) => {
    if (clickedIndex !== index) {
      setClickedIndex(index)
      onActivitySelect(activity_id)
    } else {
      setClickedIndex(null)
      onActivitySelect(null)
    }
  }
  // convert the handleActivityClick function to TypeScript
  // const handleActivityClick = (activity_id: string, bestImg: string, index: number) => {

  return (
    <div
      className="bg-white overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: resultString,
        gridGap: 0,
        width: '1080px',
        height: '7px',
        margin: '20px 0 20px 0',
        borderRadius: '4px',
        visibility: visibility,
      }}
    >
      <Tooltip
        id={'.tooltip_'}
        place="top"
        clickable
        render={({ content, activeAnchor }) => (
          <div className="w-full h-full">
            <span className="text-white font-bold text-sm w-full text-center">
              {content ? content : 'undefined'}
            </span>
            <img
              src={activeAnchor?.getAttribute('data-tooltip-img') || ''}
              alt="activity"
              className="w-[110px] h-[80px] object-contain"
            />
          </div>
        )}
      />

      {Array.from(rowData.entries()).map(([activity_id, activity_item], index) => {
        const activity = activity_item.activity
        const color = activityColorMap[activity]
        const best_img = activity_item.images[0].img_link
        return (
          <div
            key={index}
            className={`relative cursor-pointer tooltip_${index}`}
            data-tooltip-id={'.tooltip_'}
            style={{
              height: '10px',
              backgroundColor: color,
              opacity: clickedIndex === index ? '1' : '0.35',
            }}
            data-tooltip-content={activity}
            data-tooltip-img={best_img}
            data-tooltip-variant="info"
            onClick={() => handleActivityClick(activity_id, best_img, index)}
          />
        )
      })}

      {/* {data.map((activity, index) => {
                color = activityColorMap[activity];
                return(
                    <div key={index} className={`hover:${color} relative cursor-pointer tooltip_${index}`}
                    style={{ width: "100%", height: "100%", borderRadius: "10px" }}
                    onClick={() => setSelectedDate(date)}
                    >
                        {!(index % interval == 0 || index == dates.length - 1) && <Tooltip anchorSelect={`.tooltip_${index}`} place="right">{date}</Tooltip>}
                        {<div className="absolute top-[40%] w-[100px] hover:font-bold" style={{left: "10px"}}>{(index % interval == 0 || index == dates.length - 1) ? date : " "}</div>}
                    </div>
                )
            })}




            {activityColorMap.map((activity, index) => (
                <div key={index} className={`hover:{bg-red} relative cursor-pointer tooltip_${index}`}
                style={{ width: "100%", height: "100%", borderRadius: "10px" }}
                onClick={() => setSelectedDate(date)}
                >
                    {!(index % interval == 0 || index == dates.length - 1) && <Tooltip anchorSelect={`.tooltip_${index}`} place="right">{date}</Tooltip>}
                    {<div className="absolute top-[40%] w-[100px] hover:font-bold" style={{left: "10px"}}>{(index % interval == 0 || index == dates.length - 1) ? date : " "}</div>}
                </div>
            ))} */}
    </div>
  )
}

export default ActivityBar
