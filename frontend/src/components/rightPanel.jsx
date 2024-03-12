import './rightPanel.css'
import fakeimg from '../assets/bcn.png';
import React, { useEffect, useState } from 'react';
import { useSelectedImages } from '../selectedImageContext';
import imageService from '../services/imageService';
import SinglePopup from '../components/Popup/singlePopup';
import close_icon from '../assets/close.png';
import ImageInList from './Image/imageInList';

const RightPanel = ({query, filters}) => {
    const [images, setImages] = useState([]);
    const { selectedImages, addSelectedImage, removeSelectedImage, getSize, removeAllSelected } = useSelectedImages();


    const handleImageClick = (imageUrl, image) => {
        const fileName = imageUrl.split('\\').pop();
        // console.log('clicked',fileName);
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
            // console.log('adding',fileName);
            addSelectedImage(fileName, image);
            const updatedImages = images.map((record, i) => {
                if (record.path === imageUrl) {
                    return { ...record, status: 1 };
                }
                return record;
            });
            setImages(updatedImages);
        }
    }


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

    const [viewImage, setViewImage] = useState({image: "", path:"", date:"", time:""});
    
    
    const closePopup = () => {
        // console.log('closePopup');
        setViewImage({image :"", path: ""});
    }

    const openSinggleImage = (image, path, date, time) => {
        setViewImage({image: image, path: path, date: date, time: time});
    }

    return(
        <div className='right-content-container'>
            {viewImage.path !== "" && <SinglePopup closePopup={closePopup} viewImage={viewImage} openSinggleImage={openSinggleImage} />}
            <div className='submit-button-area'>
                <button className='btn btn-primary submit-button' onClick={handleClick}>Submit</button>
                <span className='submit-button-text'>Selected: {getSize()}</span>
                <button className='btn btn-danger' onClick={() => removeAllSelected()} style={{marginLeft: '20px'}}>Clear</button>
                <div className='selected-images-area'>
                    {selectedImages.map((record, index) => (
                        <div className='thumbnail-wrapper' key={index}>
                            <img key={index} src={record.image} alt={record.url} />
                            <img src={close_icon} alt='close' className='close-icon' onClick={() => removeSelectedImage(record.url)}/>
                        </div>
                        
                    ))}
                </div>
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