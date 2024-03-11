import './rightPanel.css'
import fakeimg from '../assets/bcn.png';
import React, { useEffect, useState } from 'react';
import { useSelectedImages } from '../selectedImageContext';
import imageService from '../services/imageService';
import SinglePopup from '../components/Popup/singlePopup';
import NeighborPopup from '../components/Popup/neighborPopup';
import ImageInList from './Image/imageInList';

const RightPanel = ({query, filters}) => {
    const [images, setImages] = useState([]);
    const { selectedImages, addSelectedImage, removeSelectedImage, getSize } = useSelectedImages();


    const handleImageClick = (imageUrl) => {
        const fileName = imageUrl.split('\\').pop();
        console.log('clicked',fileName);
        if(selectedImages.includes(fileName)){
            removeSelectedImage(fileName);
            const updatedImages = images.map((record) => {
                if (record.path === imageUrl) {
                    return { ...record, status: 0 };
                }
                return record;
            });
            setImages(updatedImages);
        }else{
            console.log('adding',fileName);
            addSelectedImage(fileName);
            const updatedImages = images.map((record, i) => {
                if (record.path === imageUrl) {
                    return { ...record, status: 1 };
                }
                return record;
            });
            setImages(updatedImages);
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
                        // console.log("fetching " + index + "th url: " + url);
    
                        return imageService.getImage(url)
                            .then((response) => {
                                const base64ImageString = btoa(
                                    new Uint8Array(response.data).reduce(
                                        (data, byte) => data + String.fromCharCode(byte),
                                        ''
                                    )
                                );
    
                                const imageDataUrl = `data:image/jpeg;base64,${base64ImageString}`;
    
                                // Parse the filename to extract date and time
                                const fileName = url.split('\\').pop();
                                const date = fileName.slice(0, 4) + '-' + fileName.slice(4, 6) + '-' + fileName.slice(6, 8);
                                const time = fileName.slice(9, 11) + ':' + fileName.slice(11, 13) + ':' + fileName.slice(13, 15);

                                // Add the image data to imageDataUrls
                                imageDataUrls.push({ 'image': imageDataUrl, 'path' : url, 'status': 0, 'date': date, 'time': time });
                                
                                // console.log('imageDataUrls', imageDataUrls);
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

    const [viewImage, setViewImage] = useState({image: "", path:""});
    
    
    const closePopup = () => {
        console.log('closePopup');
        setViewImage({image :"", path: ""});
    }

    const openSinggleImage = (image, path) => {
        setViewImage({image: image, path: path});
    }

    return(
        <div className='right-content-container'>
            {viewImage.path !== "" && <SinglePopup closePopup={closePopup} viewImage={viewImage} openSinggleImage={openSinggleImage} />}
            <div className='submit-button-area'>
                <button className='btn btn-primary submit-button' onClick={handleClick}>Submit</button>
                <span className='submit-button-text'>Selected: {getSize()}</span>
            </div>
            <div className='grid-container'>
            {images.map((record, index) => (
                <ImageInList key={index} record={record} index={index} handleImageClick={handleImageClick} openSinggleImage={openSinggleImage}/>
            ))}
            </div>
        </div>
    )
};

export default RightPanel;