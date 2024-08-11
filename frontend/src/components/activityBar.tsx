import { useEffect, useState } from 'react'
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'

interface Activity {
  images: any[];
  [key: string]: any; // To allow any other properties
}

interface ActivityBarProps {
  data: Activity[];
  visibility: any;
  onActivitySelect: (activity_id: any ) => void
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

const ActivityBar: React.FC<ActivityBarProps> = ({ data, visibility, onActivitySelect }) => {
  const imageCounts = data.map((entity) => `${entity.images.length}`)
  const resultString = imageCounts.map((item) => `${item}fr`).join(' ')
  if (data) {
    for (let i = 0; i < data.length; i++) {
      data[i].images.sort((a, b) => b.score - a.score)
    }
  }
  // console.log('data', data);
  const [bestImg, setBestImg] = useState(null)

  useEffect(() => {
    console.log('bestImg', bestImg)
  }, [bestImg])

  // xu ly viec click vao 1 activity nao do
  const [clickedIndex, setClickedIndex] = useState(null)
  useEffect(() => {
    console.log('bestImg', bestImg)
  }, [bestImg])
  const handleActivityClick = (activity_id: any, bestImg: any, index: any) => {
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

      {data.map((data, index) => {
        const activity_id = data.activity_id
        const activity = data.activity
        const color = activityColorMap[activity]
        const best_img = data.images[0].img_link
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
