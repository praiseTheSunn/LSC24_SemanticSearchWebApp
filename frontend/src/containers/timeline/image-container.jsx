// ImageContainer.jsx

import React from 'react';
import './image-container.css';

const ImageContainer = () => {
    return (
        <div className="image-container" style={{ display: "inline-block" }}>
            {/* Image Day 1 */}
            <div className="image-day-container">
                <div className="image-day-date">
                    <span>2021-01-01</span>
                </div>
                <div className="image-day-images">
                    <img src="images/ttpd.webp" alt="Image 1" />
                    <img src="images/ttpd-anth.webp" alt="Image 2" />
                    <img src="images/midnights-3am.webp" alt="Image 3" />
                </div>
            </div>
            {/* Image Day 2 */}
            <div className="image-day-container">
                <div className="image-day-date">
                    <span>2021-01-02</span>
                </div>
                <div className="image-day-images">
                    <img src="images/midnights-til-dawn.webp" alt="Image 4" />
                    <img src="images/midnights-3am.webp" alt="Image 5" />
                </div>
            </div>
        </div>
    );
}

export default ImageContainer;
