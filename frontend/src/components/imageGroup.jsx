import React from 'react';
import './imageGroup.css';

const ImageGroup = ({ images, title }) => {
    //sort images by score
    images.sort((a, b) => b.score - a.score);
    console.log('images', images);

    return (
        <div className="relative image-group p-0.5 flex-col flex bg-white my-1" 
        style={{ boxShadow: "2px 4px 4px 0px rgba(0, 0, 0, 0.5)"}}>
            <div className='mb-[2px]' >
                <img src={images[0] && images[0].img_link ? images[0].img_link : null} className="big-image"/>
            </div>            
            <div className="flex flex-row gap-x-0.5 w-[180px] small-images relative">
                <div className="small-image">
                    <img src={images[1] && images[1].img_link ? images[1].img_link : null} className="small-image"/>
                </div>
                <div className="small-image">
                    <img src={images[2] && images[2].img_link ? images[2].img_link : null} className="small-image"/>
                </div>
            </div>
            <div className='inline-flex items-center w-full justify-center h-[36px]'>
                <h2 className="title">{title}</h2>
            </div>
        </div>
    );
};

export default ImageGroup;
