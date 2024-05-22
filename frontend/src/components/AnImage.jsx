import view_icon from '../assets/view_icon.png';
import React from 'react';
import NeighborPopup from './Popup/neighborPopup';
import { useState } from 'react';

const AnImage = ({ src, date, time, index, onDoubleClick }) => {
    const formattedTime = `${date}  ${time}`;

    // const [showNeighborPopup, setShowNeighborPopup] = useState(false);

    // const handleDoubleClick = () => {
    //     setShowNeighborPopup(true);
    // }

    return (
        <>
            {/* {showNeighborPopup && <NeighborPopup viewImage={src} />} */}
            <div key={index} className='img-container relative w-full h-full ' onDoubleClick={() => onDoubleClick(src)}>
                <style>
                    {`.img-container:hover .img-action { display: block;}`}
                </style>
                <div className='text-xs text-white bg-black opacity-60 absolute top-0 left-0 py-1'>{formattedTime}</div>
                <img
                    src={src}
                    alt={`Image ${index}`}
                    className=' object-contain w-full max-h-[120px] cursor-pointer'
                    // onDoubleClick={handleDoubleClick}
                />
                <div className='bg-black opacity-50 absolute bottom-0 right-0 hidden img-action'
                // onClick={}
                >
                    <img
                        src={view_icon}
                        alt={`View ${index}`}
                        className='size-7'
                    />
                </div>

            </div>
        </>

    );
}

export default React.memo(AnImage);