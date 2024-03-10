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

    const handleClick = () => {
        
        // imageService.getImages()
        // .then(response => {
        //     console.log(response);
        //     const imageUrls = response.map(imageData => URL.createObjectURL(imageData));
        //     setImages(imageUrls);
        // })
        // .catch(error => {
        //     console.error('Error fetching images:', error);
        // });

        // const response = imageService.getImage("C:/Users/ADMIN/Downloads/unnamed.png")
        // .then(
        // (response) => {
        //     console.log(response);
        //     // Convert the byte data to a base64-encoded string
        //     const base64ImageString = btoa(
        //         new Uint8Array(response.data).reduce(
        //         (data, byte) => data + String.fromCharCode(byte),
        //         ''
        //         )
        //     );
    const [image, setImage] = useState(null);
    // const response = imageService.getImage("C:/Users/DELL/Pictures/8fd0ad7ae44f6a64c9016070.jpg")
    // .then(
    // (response) => {
    //      // Convert the byte data to a base64-encoded string
    //     const base64ImageString = btoa(
    //         new Uint8Array(response.data).reduce(
    //         (data, byte) => data + String.fromCharCode(byte),
    //         ''
    //         )
    //     );

    //     // Create the data URL for the image
    //     const imageDataUrl = `data:image/jpeg;base64,${base64ImageString}`;

    //     // Set the image data URL in the state
    //     setImages([imageDataUrl]);
    // })
    // .catch((error) => {
    //     console.error('Error fetching image:', error);
    // });

    const response2 = imageService.getImages("blah blah blah")
    .then(
    (response2) => {
        // Convert the byte data to a base64-encoded string
        var urls = response2.data['image_files']
        var imageDataUrls = []

        // for (var i = 0; i < urls.length; i++) {
        for (var i = 0; i < 10; i++) {
            var url = urls[i]
            console.log("fetching " + i + "th url: " + url)

            const response = imageService.getImage(url)
            .then(
            (response) => {
                 // Convert the byte data to a base64-encoded string
                const base64ImageString = btoa(
                    new Uint8Array(response.data).reduce(
                    (data, byte) => data + String.fromCharCode(byte),
                    ''
                    )
                );

                //     // Create the data URL for the image
                //     const imageDataUrl = `data:image/jpeg;base64,${base64ImageString}`;

                imageDataUrls.push(imageDataUrl)

                // Set the image data URL in the state
                
            })
            .catch((error) => {
                console.error('Error fetching image:', error);
            });
        }
        setImages(imageDataUrls);
        
        
        // const base64ImageString = btoa(
        //     new Uint8Array(response.data).reduce(
        //     (data, byte) => data + String.fromCharCode(byte),
        //     ''
        //     )
        // );

        // Create the data URL for the image
        // const imageDataUrl = `data:image/jpeg;base64,${base64ImageString}`;

        //     // Set the image data URL in the state
        // //     console.log(imageDataUrl);
        //     setImages([imageDataUrl]);
        // })
        // .catch((error) => {
        //     console.error('Error fetching images:', error);
        // });
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