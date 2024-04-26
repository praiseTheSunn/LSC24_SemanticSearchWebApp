import { useEffect, useState } from "react";
import { Tooltip } from 'react-tooltip'


// create a map from activity to color code
const activityColorMap = {
    "Breakfast": "green",
    "Drive to work": "yellow",
    "Lecturing": "purple"
}

const ActivityBar = ({data}) => {

    const imageCounts = data.map(entity => `${entity.images.length}`);
    const resultString = imageCounts.map(item => `${item}fr`).join(' ');

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

            {data.map((data, index) => {
                const activity = data.activity;
                const color = activityColorMap[activity];
                console.log("index", index)
                console.log('color', color)
                return(
                    <div 
                        key={index} 
                        className={`relative cursor-pointer tooltip_${index}`}      
                        style={{ 
                            height: "7px", 
                            borderRadius: "10px", 
                            backgroundColor: color,
                        }}
                    // onClick={() => setSelectedDate(date)}
                    >
                        {<Tooltip anchorSelect={`.tooltip_${index}`} place="top">{activity}</Tooltip>}
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