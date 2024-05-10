// ImageGrid.jsx

import './similarity.css'
import React, { useEffect, useState } from 'react';
import Scrollbarsim from './scroll-bar-sim';
import view_icon from '../../assets/view_icon.png'
import ImageCluster from './image-cluster';

// const ImageGridTime = ({ simData }) => {

//     const updatedData = simData.map(item => {
//         const { path } = item;
//         const cate_date_time = path.substring(path.length - 24, path.length - 13);
//         return { ...item, cate_date_time };
//     });

//     const groupedData = updatedData.reduce((result, item) => {
//         const { cate_date_time } = item;
//         if (!result[cate_date_time]) {
//             result[cate_date_time] = [];
//         }
//         result[cate_date_time].push(item);
//         return result;
//     }, {});

//     const simiDataTime = []
//     for (const key in groupedData) {
//         for (const item in groupedData[key]) {
//             // console.log('item', groupedData[key][item]);
//             simiDataTime.push(groupedData[key][item])
//         }
//     }

//     return (
//         <div className='image-grid'>
//             <Scrollbarsim>
//                 {/* create a grid of image */}
//                 <div className='grid-container'>
//                     {simiDataTime.map((data, index) => {
//                         const { path, date, time } = data;
//                         const formattedTime = `${date} ${time}`;
//                         return (
//                             // add event to open singlePopup at every image
//                             <div key={index} className='image-wrapper'>
//                                 <div className='overlay'>{formattedTime}</div>
//                                 <img
//                                     src={path}
//                                     alt={`Image ${index}`}
//                                     className='image-item'
//                                 // onClick={() => openSinggleImage(null, path, date, time)}
//                                 />
//                                 <img
//                                     src={view_icon}
//                                     alt={`View ${index}`}
//                                     className='view-item'
//                                 />
//                             </div>
//                         );
//                     })}
//                 </div>
//             </Scrollbarsim>
//         </div>
//     );
// }


const groupDataByDate = (data) => {
    const groupedData = {};
    
    // Gom nhóm dữ liệu theo date
    data.forEach((item) => {
        if (!groupedData[item.date]) {
            groupedData[item.date] = {
                date_name: item.date,
                images: [],
            };
        }
        groupedData[item.date].images.push(item.path);
    });

    // Tạo thêm các mục mới nếu một date có nhiều hơn 3 ảnh
    Object.values(groupedData).forEach((group) => {
        const { date_name, images } = group;
        const numExtraImages = Math.ceil((images.length - 3) / 2);
        if (numExtraImages > 0) {
            for (let i = 0; i < numExtraImages; i++) {
                groupedData[`${date_name} ${i + 2}`] = {
                    date_name,
                    images: images.slice(i * 2 + 3, i * 2 + 5),
                };
            }
            group.images = images.slice(0, 3);
        }
    });

    return Object.values(groupedData);
};    

const ImageGridTime = ({data}) => {
    const imageClusters = groupDataByDate(data);

    return (
        <div className='image-date'>
            <Scrollbarsim>
                <div className='grid-container-2'>
                    {imageClusters.map((imageCluster, index) => (
                        <ImageCluster
                            key={index}
                            bigImage={imageCluster.images[0]}
                            smallImage1={imageCluster.images.length >= 2 ? imageCluster.images[1] : imageCluster.images[0]}
                            smallImage2={imageCluster.images.length >= 3 ? imageCluster.images[2] : imageCluster.images[0]}
                            location_name={imageCluster.date_name}
                        />
                    ))}
                </div>
            </Scrollbarsim>
        </div>
    );
};


export default ImageGridTime;