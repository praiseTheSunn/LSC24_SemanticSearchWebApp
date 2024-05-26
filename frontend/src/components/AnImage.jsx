import view_icon from '../assets/view_icon.png';
import React from 'react';
const AnImage = ({src, date, time, index}) => {
    const formattedTime = `${date}  ${time}`;
    return (
        <div key={index} className='an-img-container relative w-full h-full hover:z-50 hover:scale-105 overflow-hidden rounded-xl transition-transform duration-300 ease-in-out' >
            <style>
                {`.an-img-container:hover .img-action { display: block;}`}
                {'.an-img-container:hover  .image-item-img { border: 2px solid rgb(0, 47, 255); }'}
                {/* {'.an-img-container:hover .info-item { transform: scale(1.05);  }'} */}
                {/* {'an-img-container:hover .image-item-img {  }'} */}

            </style>
            <div className='info-item text-xs text-white bg-black opacity-60 absolute top-0 left-0 py-1'>{formattedTime}</div>
            <img
                src={src}
                alt={`Image ${index}`}
                // className=' object-contain w-full max-h-[140px] cursor-pointer'
                className='  max-w-full h-full cursor-pointer mx-auto  image-item-img bg-white'
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

export default React.memo(AnImage);