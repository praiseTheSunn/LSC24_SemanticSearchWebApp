// image-cluster.jsx

// import './image-cluster.css';
import './similarity.css';
import React, { useEffect, useState } from 'react';

const ImageCluster = ({
    bigImage,
    smallImage1,
    smallImage2,
    location_name
    }) => {
    return (
        <div className="image-cluster-container">
            <div className="big-image-container">
                <img src={bigImage} alt="big-image" className='big-image-cluster' />
            </div>
            <div className="small-image-container">
                <div>
                    <img src={smallImage1} alt="small-image" className='small-image-cluster'/>
                </div>
                <div>
                    <img src={smallImage2} alt="small-image" className='small-image-cluster'/>
                </div>
            </div>
            <div className="location-name">
                {location_name}
            </div>
        </div>
    );
}

export default ImageCluster;