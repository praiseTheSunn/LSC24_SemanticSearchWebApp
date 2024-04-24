import { useEffect, useState } from "react";
import { Tooltip } from 'react-tooltip'

const KhangScrollBar = ({dates, setSelectedDate}) => {

    const [interval, setInterval] = useState(dates.length / (dates.length > 10 ? dates.length * 50 / 100 : dates.length));
    
    return(
        <div className="grid bg-lightGray" style={{ width:"7px", height: "98%" }}>
            {dates.map((date, index) => (
                <div key={index} className={`hover:bg-red relative cursor-pointer tooltip_${index}`}
                style={{ width: "100%", height: "100%", borderRadius: "10px" }}
                onClick={() => setSelectedDate(date)}
                >
                    {!(index % interval == 0 || index == dates.length - 1) && <Tooltip anchorSelect={`.tooltip_${index}`} place="right">{date}</Tooltip>}
                    {<div className="absolute top-[40%] w-[100px] hover:font-bold" style={{left: "10px"}}>{(index % interval == 0 || index == dates.length - 1) ? date : " "}</div>}
                </div>
            ))}
        </div>
    );
};

export default KhangScrollBar;