import React from 'react';
import './imageGroup.css';

const ImageGroup = ({ bigImageSrc, smallImage1Src, smallImage2Src, title }) => {
    return (
        <div className="image-group">
            <div >
                <img src={bigImageSrc} className="big-image"/>
            </div>            
            <div className="small-images">
                <div>
                    <img src={smallImage1Src} className="small-image"/>
                </div>
                <div className="small-image">
                    <img src={smallImage2Src} className="small-image"/>
                </div>
            </div>
            <div>
                <h2 className="title">{title}</h2>
            </div>
        </div>
    );
};

export default ImageGroup;
