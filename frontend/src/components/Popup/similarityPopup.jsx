import './similarityPopup.css';

import React from 'react';

import fakeimg from '../../assets/bcn.png';

const ImageComponent = () => {
    const links = [
        fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
        // fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
        // fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
        // fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
    ]

    return (
        <div style={{ display: 'flex' }}>
            <div style={{ flex: '40%' }}>
                <img src={fakeimg} alt="Single Image" />
            </div>
            <div className='SimilarityGrid'>
                {links.map((link, index) => (
                    <img key={index} src={link} alt={`Image ${index}`} />
                ))}
            </div>
        </div>
    );
};

export default ImageComponent;