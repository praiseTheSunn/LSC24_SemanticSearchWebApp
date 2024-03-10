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
        src:"",
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

    // const handleClick = () => {        


    //     const response2 = imageService.getImages("blah blah blah")
    //     .then(
    //     (response2) => {
    //         // Convert the byte data to a base64-encoded string
    //         var urls = response2.data['image_files']
    //         var imageDataUrls = []

    //         // for (var i = 0; i < urls.length; i++) {
    //         for (var i = 0; i < 10; i++) {
    //             var url = urls[i]
    //             console.log("fetching " + i + "th url: " + url)

    //             const response = imageService.getImage(url)
    //             .then(
    //             (response) => {
    //                 // Convert the byte data to a base64-encoded string
    //                 const base64ImageString = btoa(
    //                     new Uint8Array(response.data).reduce(
    //                     (data, byte) => data + String.fromCharCode(byte),
    //                     ''
    //                     )
    //                 );

    //                 // Create the data URL for the image
    //                 const imageDataUrl = `data:image/jpeg;base64,${base64ImageString}`;

    //                 imageDataUrls.push(
    //                     { src: imageDataUrl, status: i }
    //                 )
    //             })
    //             .catch((error) => {
    //                 console.error('Error fetching image:', error);
    //             });
    //         }
    //         setImages(imageDataUrls);
    //     })
    //     .catch((error) => {
    //         console.error('Error fetching images:', error);
    //     });

    //     // const response = imageService.getImage("C:/Users/ADMIN/Downloads/unnamed.png")
    //     // .then(
    //     // (response) => {
    //     //     console.log(response);
    //     //     // Convert the byte data to a base64-encoded string
    //     //     const base64ImageString = btoa(
    //     //         new Uint8Array(response.data).reduce(
    //     //         (data, byte) => data + String.fromCharCode(byte),
    //     //         ''
    //     //         )
    //     //     );
    // }

    const handleClick = () => {
        // First HTTP request
        const response2 = imageService.getImages("blah blah blah")
            .then((response2) => {
                // Convert the byte data to a base64-encoded string
                var urls = response2.data['image_files'];
                var imageDataUrls = [];
    
                // Second HTTP request (sequentially inside the loop)
                // You can use Promise.all() if you want to make requests concurrently
                const fetchImages = (index) => {
                    if (index < 50) {
                        var url = urls[index];
                        console.log("fetching " + index + "th url: " + url);
    
                        return imageService.getImage(url)
                            .then((response) => {
                                const base64ImageString = btoa(
                                    new Uint8Array(response.data).reduce(
                                        (data, byte) => data + String.fromCharCode(byte),
                                        ''
                                    )
                                );
    
                                const imageDataUrl = `data:image/jpeg;base64,${base64ImageString}`;
    
                                // imageDataUrls.push({ src: imageDataUrl, status: index });
                                imageDataUrls.push(imageDataUrl);
    
                                // Recursive call to fetch the next image
                                return fetchImages(index + 1);
                            })
                            .catch((error) => {
                                console.error('Error fetching image:', error);
                            });
                    } else {
                        // All images fetched, set the state or do other operations
                        setImages(imageDataUrls);
                    }
                };
    
                // Start fetching images from index 0
                return fetchImages(0);
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
            {images.map((imageUrl, index) => (
                <img key={index} className='grid-item' src={imageUrl} alt={`no. ${index}`} />
            ))}
            </div>
            {/* some more div tag here */}
        </div>
    )
};

export default RightPanel;