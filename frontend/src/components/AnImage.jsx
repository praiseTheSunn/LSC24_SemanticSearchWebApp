import view_icon from '../assets/view_icon.png';
import React from 'react';
const AnImage = ({src, date, time, index}) => {
    const formattedTime = `${date}  ${time}`;
    return (
        <div key={index} className='img-container relative w-full h-full' >
            <style>
                {`.img-container:hover .img-action { display: block;}`}
            </style>
            <div className='text-xs text-white bg-black opacity-60 absolute top-0 left-0 py-1'>{formattedTime}</div>
            <img
                src={src}
                alt={`Image ${index}`}
                className=' object-contain max-w-full h-full cursor-pointer'
                // onClick={() => openSinggleImage(null, img_link, date, time)}
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
    );
}

export default AnImage;