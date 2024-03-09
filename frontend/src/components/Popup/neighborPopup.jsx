import './neighborPopup.css';
import React from 'react';

import fakeimg from '../../assets/bcn.png';

const NeighborPopup = () => {
    const links = [
        fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
        // fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
        // fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
        // fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
    ]

    return (
        <div style={{ flex: '60%', display: 'grid', gridTemplateColumns: 'repeat(5, 100fr)', gap: '10px' }}>
            {links.map((link, index) => (
                <img key={index} src={link} alt={`Image ${index}`} />
            ))}
        </div>
    );
};

export default NeighborPopup;