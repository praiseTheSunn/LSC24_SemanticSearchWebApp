// image-location.jsx

import './image-location.css';
import React, { useEffect, useState } from 'react';
import ImageCluster from './image-cluster';
import Scrollbarsim from './scroll-bar-sim';

const ImageLocation = () => {
    const imageClusters = [
        {
            bigImage: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage1: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage2: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            location_name: 'Location 1'
        },
        {
            bigImage: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage1: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage2: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            location_name: 'Location 2'
        },
        {
            bigImage: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage1: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage2: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            location_name: 'Location 3'
        },
        {
            bigImage: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage1: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage2: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            location_name: 'Location 4'
        },
        {
            bigImage: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage1: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage2: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            location_name: 'Location 5'
        },
        {
            bigImage: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage1: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage2: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            location_name: 'Location 6'
        },
        {
            bigImage: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage1: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage2: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            location_name: 'Location 7'
        },
        {
            bigImage: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage1: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage2: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            location_name: 'Location 8'
        },
        {
            bigImage: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage1: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage2: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            location_name: 'Location 9'
        },
        {
            bigImage: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage1: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage2: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            location_name: 'Location 10'
        },
        {
            bigImage: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage1: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage2: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            location_name: 'Location 11'
        },
        {
            bigImage: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage1: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage2: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            location_name: 'Location 12'
        },
        {
            bigImage: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage1: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage2: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            location_name: 'Location 13'
        },
        {
            bigImage: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage1: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage2: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            location_name: 'Location 14'
        },
        {
            bigImage: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage1: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage2: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            location_name: 'Location 15'
        },
        {
            bigImage: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage1: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage2: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            location_name: 'Location 16'
        },
        {
            bigImage: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage1: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage2: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            location_name: 'Location 17'
        },
        {
            bigImage: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage1: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage2: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            location_name: 'Location 18'
        },
        {
            bigImage: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage1: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            smallImage2: 'http://34.124.236.208/img_lsc/201901/01/20190101_103717_000.webp',
            location_name: 'Location 19'
        },

    ]

    return (
        <div className='image-location'>
            <Scrollbarsim>
            <div className='grid-container-2'>
            {imageClusters.map((imageCluster, index) => (
                <ImageCluster
                    key={index}
                    bigImage={imageCluster.bigImage}
                    smallImage1={imageCluster.smallImage1}
                    smallImage2={imageCluster.smallImage2}
                    location_name={imageCluster.location_name}
                />
            ))}
            </div>
            </Scrollbarsim>
        </div>
    );
};

export default ImageLocation;