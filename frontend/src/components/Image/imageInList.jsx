import './imageInList.css'
import view_icon from '../../assets/view_icon.png'
import React, { useEffect, useState } from 'react';

const ImageInList = ({record, index, handleImageClick, openSinggleImage, setImageUrls}) => {
    
    const has_origin = record['is_origin'] !== undefined ? 1 : 0;
    console.log('status', record.status, record.path)
    // console.log('has_origin', has_origin, record.is_origin, record.path);
    return(
        <div className={`img-container ${record.status === 1 ? 'clicked' : ''}`} key={index}
            style={{backgroundColor: has_origin && record.is_origin === 1 ? '#ff0000' : ''}}
        >
            <div className='img-wrapper'>

                <div className='img-info'>
                    <span>{record.date}</span>
                    <span>{record.time}</span>
                </div>
                
                <img key={index} className='grid-item' src={record.image} alt={`no. ${index}`} onClick={() => handleImageClick(record.path, record.image)} />
                
                <div className='img-action'>
                    <img src={view_icon} alt='view' onClick={() => openSinggleImage(record.image, record.path, record.date, record.time)} className='view_icon_img'/>
                </div>
                
            </div>
            
        </div>
    );
};

export default ImageInList;
