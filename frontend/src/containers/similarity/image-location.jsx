// image-location.jsx

// import './image-location.css';
import './similarity.css';
import React, { useEffect, useState } from 'react';
import ImageCluster from './image-cluster';
import Scrollbarsim from './scroll-bar-sim';

const groupDataByLocation = (data) => {
    const groupedData = {};
    
    // Gom nhóm dữ liệu theo location
    data.forEach((item) => {
        if (!groupedData[item.location]) {
            groupedData[item.location] = {
                location_name: item.location,
                images: [],
            };
        }
        groupedData[item.location].images.push(item.path);
    });

    // Tạo thêm các mục mới nếu một location có nhiều hơn 3 ảnh
    Object.values(groupedData).forEach((group) => {
        const { location_name, images } = group;
        const numExtraImages = Math.ceil((images.length - 3) / 2);
        if (numExtraImages > 0) {
            for (let i = 0; i < numExtraImages; i++) {
                groupedData[`${location_name} ${i + 2}`] = {
                    location_name,
                    images: images.slice(i * 2 + 3, i * 2 + 5),
                };
            }
            group.images = images.slice(0, 3);
        }
    });

    return Object.values(groupedData);
};    

const ImageLocation = ({data}) => {
    const imageClusters = groupDataByLocation(data);

    return (
        <div className='image-location'>
            <Scrollbarsim>
                <div className='grid-container-2'>
                    {imageClusters.map((imageCluster, index) => (
                        <ImageCluster
                            key={index}
                            bigImage={imageCluster.images[0]}
                            smallImage1={imageCluster.images.length >= 2 ? imageCluster.images[1] : imageCluster.images[0]}
                            smallImage2={imageCluster.images.length >= 3 ? imageCluster.images[2] : imageCluster.images[0]}
                            location_name={imageCluster.location_name}
                        />
                    ))}
                </div>
            </Scrollbarsim>
        </div>
    );
};

export default ImageLocation;