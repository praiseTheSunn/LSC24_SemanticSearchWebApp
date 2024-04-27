// ImageGrid.jsx

import './similarity.css'
import React, { useEffect, useState } from 'react';
import Scrollbarsim from './scroll-bar-sim';
import view_icon from '../../assets/view_icon.png'


const ImageGrid = ({ simData }) => {
    return (
        <div className='image-grid'>
            <Scrollbarsim>
                {/* create a grid of image */}
                <div className='grid-container'>
                    {simData.map((data, index) => {
                    const { path, date, time } = data;
                    const formattedTime = `${date} ${time}`;
                    return (
                        // add event to open singlePopup at every image
                        <div key={index} className='image-wrapper'>
                            <div className='overlay'>{formattedTime}</div>
                            <img
                                src={path}
                                alt={`Image ${index}`}
                                className='image-item'
                                // onClick={() => openSinggleImage(null, path, date, time)}
                            />
                            <img
                                src={view_icon}
                                alt={`View ${index}`}
                                className='view-item'
                            />
                        </div>
                    );
                })}
                </div>
            </Scrollbarsim>
        </div>
    );
}

export default ImageGrid;