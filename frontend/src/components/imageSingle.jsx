import React from 'react';
import './imageSingle.css';
import AnImage from './AnImage';

// instead of ImageGroup, now create a new component called ImageSingle
const ImageSingle = ({ image, title }) => {

    return (
        <div className="relative image-group p-0.5 flex-col flex bg-white my-1"
        style={{ boxShadow: "2px 4px 4px 0px rgba(0, 0, 0, 0.5)", maxHeight: "230px"}}>
            <div className='mb-[2px]' 
            style={{
                width: '100%',
                height: '120px',
                objectFit: 'contain',
                minWidth: '160px',
            }}
            >
                <AnImage src={image.img_link} date={image.date} time={image.time} />
            </div>            
            <div className='inline-flex items-center w-full justify-center h-[36px] max-w-[180px]'>
                <h2 className="title truncate" title={title}>{title}</h2>
            </div>
        </div>
    );
}

export default ImageSingle;
