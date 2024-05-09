// ImageGrid.jsx

import './similarity.css'
import React, { useEffect, useState } from 'react';
import Scrollbarsim from './scroll-bar-sim';
import view_icon from '../../assets/view_icon.png'


const ImageGridTime = ({ simData }) => {

    const updatedData = simData.map(item => {
        const { path } = item;
        const cate_date_time = path.substring(path.length - 24, path.length - 13);
        return { ...item, cate_date_time };
    });

    const groupedData = updatedData.reduce((result, item) => {
        const { cate_date_time } = item;
        if (!result[cate_date_time]) {
            result[cate_date_time] = [];
        }
        result[cate_date_time].push(item);
        return result;
    }, {});

    const simiDataTime = []
    for (const key in groupedData) {
        for (const item in groupedData[key]) {
            // console.log('item', groupedData[key][item]);
            simiDataTime.push(groupedData[key][item])
        }
    }

    return (
        <div className='image-grid'>
            <Scrollbarsim>
                {/* create a grid of image */}
                <div className='grid-container'>
                    {simiDataTime.map((data, index) => {
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

export default ImageGridTime;