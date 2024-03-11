import './rightPanel.css'
import fakeimg from '../assets/bcn.png';
import React, { useState } from 'react';
import { useSelectedImages } from '../selectedImageContext';
import imageService from '../services/imageService';
import LazyLoad from 'react-lazy-load';

// import '../file_index.js'

const RightPanel = ({query, filters}) => {
    const links = [
        fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
        // fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
        // fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
        // fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,fakeimg,
    ]
    // var imageUrls = []
    const [imageUrls, setImageUrls] = useState([{
        srcUrl: "",
        src: "",
    }]);

    const { selectedImages, addSelectedImage, removeSelectedImage, getSize, getPath } = useSelectedImages();

    const handleImageClick = (imageUrl) => {
        if(selectedImages.includes(imageUrl)){
            removeSelectedImage(imageUrl);
        }else{
            addSelectedImage(imageUrl);
        }
    }

    const handleImageVisibility = (url, index) => {
        const response = imageService.getImage(url)
            .then((response) => {
                const base64ImageString = btoa(
                    new Uint8Array(response.data).reduce(
                        (data, byte) => data + String.fromCharCode(byte),
                        ''
                    )
                );

                const imageDataUrl = `data:image/jpeg;base64,${base64ImageString}`;

                setImageUrls(prevImageUrls => {
                    // Make a copy of the previous state
                    const newImageUrls = [...prevImageUrls];

                    // Update the copy of state based on previous values
                    newImageUrls[index] = {
                        ...newImageUrls[index],
                        src: imageDataUrl,
                    };

                    // Return the updated state
                    return newImageUrls;
                });
            })
            .catch((error) => {
                console.error('Error fetching image:', error);
            });

      };



    const handleClick = () => {
        // First HTTP request
        const response2 = imageService.getImages("blah blah blah")
            .then((response2) => {
                // Convert the byte data to a base64-encoded string
                var urls = response2.data['image_files'];
                var imageDataUrls = [];

                for (var i = 0; i < urls.length; i++) {
                    const data = {
                        srcUrl: urls[i],
                        src: "",
                    }
                    imageDataUrls.push(data);
                }
                setImageUrls(imageDataUrls);
            })
            .catch((error) => {
                console.error('Error fetching images:', error);
            });
    
        // You can add more code here or handle subsequent actions after the requests
    }


    return(
        <div className='right-content-container'>
            <div className='submit-button-area'>
                <button className='btn btn-primary submit-button' onClick={handleClick}>Submit</button>
                <span className='submit-button-text'>Selected: {getSize}</span>
            </div>
            <div className='grid-container'>
            {/* {images.map((imageUrl, index) => (
                <img key={index} className='grid-item' src={imageUrl} alt={`no. ${index}`} loading= "lazy" />
            ))} */}

            {imageUrls.map((data, index) => (
                <LazyLoad
                    key={index}
                    height={200} // Set a height for the placeholder
                    offset={100} // Set an offset to trigger the lazy load before the image comes into view
                    once
                    onContentVisible={() => handleImageVisibility(data.srcUrl, index)}
                    >
                    <img
                        key={index} className='grid-item' alt={`no. ${index}`}
                        src={data.src}
                        
                    />
                    
                </LazyLoad>
            ))}       
            </div>
            
            {/* some more div tag here */}
        </div>
    )
};

export default RightPanel;