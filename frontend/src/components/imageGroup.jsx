import React from 'react';
import './imageGroup.css';
import AnImage from './AnImage';

const ImageGroup = ({ images, title, sortType = 0 }) => {
    if (sortType === 1){
        // sort images by time string
        images.sort((a, b) => a.time.localeCompare(b.time));
    }
    else {
        //sort images by score
        images.sort((a, b) => b.score - a.score);
    }
    
    // console.log('images',title, sortType, images);

    return (
        <div className="relative image-group p-0.5 flex-col flex bg-white my-1" 
        style={{ boxShadow: "2px 4px 4px 0px rgba(0, 0, 0, 0.5)", maxHeight: "230px"}}>
            <div className='mb-[2px]' 
            style={{
                width: '100%',
                height: '120px',
                objectFit: 'contain',
                minWidth: '160px'
            }}
            >
                <AnImage src={images[0] && images[0].img_link ? images[0].img_link : null} date={images[0].date} time={images[0].time} />
                {/* <img src={images[0] && images[0].img_link ? images[0].img_link : null} style={{
                    
                }}/> */}
            </div>            
            <div className="flex flex-row gap-x-0.5 w-full small-images relative justify-center">
                <div className="small-image">
                    <img src={images[1] && images[1].img_link ? images[1].img_link : null} className="small-image"/>
                </div>
                <div className="small-image">
                    <img src={images[2] && images[2].img_link ? images[2].img_link : null} className="small-image"/>
                </div>
            </div>
            <div className='inline-flex items-center w-full justify-center h-[36px] max-w-[180px]'>
                <h2 className="title truncate" title={title}>{title}</h2>
            </div>
        </div>
    );
};

export default ImageGroup;
