import { useEffect, useState } from "react";
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'


// create a map from activity to color code
const activityColorMap = {
    "Breakfast": "green",
    "Drive to work": "yellow",
    "Lecturing": "purple"
}

const ActivityBar = ({data}) => {

    const imageCounts = data.map(entity => `${entity.images.length}`);
    const resultString = imageCounts.map(item => `${item}fr`).join(' ');
    if (data){
        for (let i = 0; i < data.length; i++) {
            data[i].images.sort((a, b) => b.score - a.score);
        }
    }
    console.log('data', data);
    const [bestImg, setBestImg] = useState(null);

    useEffect(() => {
        console.log('bestImg', bestImg);
    }, [bestImg]);
    return(
        <div className="bg-lightGray" style={{             
            display: "grid",
            gridTemplateColumns: resultString,
            gridGap: 0,
            width: "1080px",
            height: "7px", 
            margin: "20px 0 20px 0", 
            borderRadius: "4px",
            // visibility: "hidden" 
            }}>
            <Tooltip id={`.tooltip_`} place="top" clickable 
                render={({content, activeAnchor}) => (
                    <div className="w-full h-full">
                        <span className="text-white font-bold text-sm w-full text-center">{content ? content : "undefined"}</span>
                        <img src={activeAnchor?.getAttribute('data-tooltip-img') || null} alt="activity" className="w-[110px] h-[80px] object-contain" />
                    </div>
                )}
            >
            </Tooltip>
            {data.map((data, index) => {
                const activity = data.activity;
                const color = activityColorMap[activity];
                console.log("index", index)
                console.log('color', color)
                const best_img = data.images[0].img_link;
                return(
                    <div 
                        key={index} 
                        className={`relative cursor-pointer tooltip_${index}`}  
                        data-tooltip-id={`.tooltip_`}
                        style={{ 
                            height: "7px", 
                            borderRadius: "10px", 
                            backgroundColor: color,
                        }}
                        data-tooltip-content={activity}
                        data-tooltip-img={best_img}
                        data-tooltip-variant="info"
                    >
                    </div>
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
            });
        } */}







            {/* {activityColorMap.map((activity, index) => (
                <div key={index} className={`hover:{bg-red} relative cursor-pointer tooltip_${index}`}
                style={{ width: "100%", height: "100%", borderRadius: "10px" }}
                onClick={() => setSelectedDate(date)}
                >
                    {!(index % interval == 0 || index == dates.length - 1) && <Tooltip anchorSelect={`.tooltip_${index}`} place="right">{date}</Tooltip>}
                    {<div className="absolute top-[40%] w-[100px] hover:font-bold" style={{left: "10px"}}>{(index % interval == 0 || index == dates.length - 1) ? date : " "}</div>}
                </div>
            ))} */}
        </div>
    );
};

export default ActivityBar;