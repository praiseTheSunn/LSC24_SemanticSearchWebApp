import './imageInList.css'
import view_icon from '../../assets/view_icon.png'
import React, { useEffect, useState } from 'react';

const ImageInList = ({record, index, handleImageClick, openSinggleImage, setImageUrls}) => {
    
    return(
        <div className={`img-container ${record.status === 1 ? 'clicked' : ''}`} key={index}>
            <div className='img-wrapper'>

                <div className='img-info'>
                    <span>{record.date}</span>
                    <span>{record.time}</span>
                </div>
                
                <img key={index} className='grid-item' src={record.image} alt={`no. ${index}`} onClick={() => handleImageClick(record.path)} />
                
                <div className='img-action'>
                    <img src={view_icon} alt='view' onClick={() => openSinggleImage(record.image, record.path)} className='view_icon_img'/>
                </div>
                
            </div>
            
        </div>
    );
};

export default ImageInList;
