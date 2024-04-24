// ImageContainer.jsx

import React from 'react';
import './imageContainer.css';
import ImageGroup from './imageGroup';

const imageUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRY2oYj5Olj4XiuIB5uEeaWbxc8Y6_Zup5lcfEUCt5IIidsiHIUR_2xua7vepE7RP4KHCw&usqp=CAU"
// const imageUrl = "https://www.yourcelebritymagazines.com/cdn/shop/files/A360_TAYLORSWIFT_TTPD_COV_APR_2024_V2_80_copy_1800x1800_1602402a-efde-486d-b22b-bc1c6bd7cfa5.webp?v=1713265674"

const ImageContainer = () => {
    return (
        <div className="image-container">
            {/* Image Day 1 */}
            <div className="image-day-container">
                <div className="image-day-date">
                    <span>2021-01-01</span>
                </div>
                <div className="image-day-images">
                <ImageGroup 
                        bigImageSrc = {imageUrl}
                        smallImage1Src = {imageUrl}
                        smallImage2Src = {imageUrl}
                        title = "Climbing"/>
                <ImageGroup 
                        bigImageSrc = {imageUrl}
                        smallImage1Src = {imageUrl}
                        smallImage2Src = {imageUrl}
                        title = "Climbing"/>
                <ImageGroup 
                        bigImageSrc = {imageUrl}
                        smallImage1Src = {imageUrl}
                        smallImage2Src = {imageUrl}
                        title = "Climbing"/>
                </div>
            </div>
            {/* Image Day 2 */}
            <div className="image-day-container">
                <div className="image-day-date">
                    <span>2021-01-02</span>
                </div>
                <div className="image-day-images">
                    <ImageGroup 
                        bigImageSrc = {imageUrl}
                        smallImage1Src = {imageUrl}
                        smallImage2Src = {imageUrl}
                        title = "Climbing"/>
                </div>
            </div>
            {/* Image Day 3 */}
            <div className="image-day-container">
                <div className="image-day-date">
                    <span>2021-01-03</span>
                </div>
                <div className="image-day-images">
                    <ImageGroup 
                        bigImageSrc = {imageUrl}
                        smallImage1Src = {imageUrl}
                        smallImage2Src = {imageUrl}
                        title = "Climbing"/>
                </div>
            </div>
        </div>
    );
};

export default ImageContainer;
