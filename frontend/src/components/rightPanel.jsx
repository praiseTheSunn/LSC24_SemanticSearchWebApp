import './rightPanel.css'
import fakeimg from '../assets/bcn.png';
import React, { useState } from 'react';
import { useSelectedImages } from '../selectedImageContext';
import imageService from '../services/imageService';
// import '../file_index.js'

const RightPanel = ({query, filters}) => {
    const links = [
        fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
        // fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
        // fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
        // fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
    ]
    const [images, setImages] = useState([{
        src:"20190201_080944_000.jpg",
        status: 0,
    }]);
    const { selectedImages, addSelectedImage, removeSelectedImage, getSize, getPath } = useSelectedImages();

    const handleImageClick = (imageUrl) => {
        if(selectedImages.includes(imageUrl)){
            removeSelectedImage(imageUrl);
        }else{
            addSelectedImage(imageUrl);
        }
    }
    const [image, setImage] = useState(null);
    const response = imageService.getImage("C:%5CUsers%5CADMIN%5CDownloads%5Cunnamed.png")
        .then(
        (response) => {
            setImage(response);
        })
        .catch((error) => {
            console.error('Error fetching image:', error);
        });


    return(
        <div className='right-content-container'>
            <div className='submit-button-area'>
                <button className='btn btn-primary submit-button'>Submit</button>
                <span className='submit-button-text'>Selected: {getSize}</span>
            </div>
            <div className='grid-container'>
                {images.map((image, index) => (
                    <div key={index} className='grid-item'>
                        <img src={image} alt={`no. ${index}`}
                            onClick={() => {handleImageClick(image.src)}}
                        />
                    </div>
                ))}
            </div>
            {/* some more div tag here */}
        </div>
    )
};

export default RightPanel;