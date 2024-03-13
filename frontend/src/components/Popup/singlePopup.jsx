import './singlePopup.css'
import closeIcon from '../../assets/close.png'
import bcn from '../../assets/bcn.png'
import NeighborPopup from './neighborPopup'
import React, { useState, useEffect } from 'react';
import imageService from '../../services/imageService';
import ImageInList from '../Image/imageInList';
import { useSelectedImages } from '../../contexts/selectedImageContext';
import { usePopUp } from '../../contexts/popUpContext';

const SinglePopup = ({viewImage, openSinggleImage}) => {
    const { setSimilarPopUp, neighborPopUp, setNeighborPopUp } = usePopUp();

    const [similarImages, setSimilarImages] = useState([]);

    //Fetch the similar images when the viewImage.path changes
    useEffect(() => {
        console.log('fetching similar images for', viewImage.path);
        const response2 = imageService.getSimilarImages(viewImage.path)
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
                            url = url.replace(/\//g, '\\');

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
                    setSimilarImages(imageDataUrls);
                    // console.log('similarImages', similarImages);
                }
            };

            // Start fetching images from index 0
            return fetchImages(0);
        })
        .catch((error) => {
            console.error('Error fetching similar images:', error);
        });
    }, [viewImage.path]); // Trigger the effect when viewImage.path changes

    const { selectedImages, addSelectedImage, removeSelectedImage } = useSelectedImages();

    const handleSelectClick = () => {
        const fileName = viewImage.path.split('\\').pop();
        // console.log('selectedImage', fileName);
        if(selectedImages.includes(fileName)){
            removeSelectedImage(fileName);
            viewImage.status = 0;
        }else{
            // console.log('adding',fileName);
            addSelectedImage(fileName, viewImage.image);
            viewImage.status = 1;
        }
    }

    const handleImageClick = (imageUrl) => {
        const fileName = imageUrl.split('\\').pop();
        // console.log('clicked',fileName);
        if(selectedImages.includes(fileName)){
            removeSelectedImage(fileName);
            const updatedImages = similarImages.map((record) => {
                if (record.path === imageUrl) {
                    return { ...record, status: 0 };
                }
                return record;
            });
            setSimilarImages(updatedImages);
        }else{
            // console.log('adding',fileName);
            addSelectedImage(fileName, viewImage.image);
            const updatedImages = similarImages.map((record, i) => {
                if (record.path === imageUrl) {
                    return { ...record, status: 1 };
                }
                return record;
            });
            setSimilarImages(updatedImages);
        }
    }    

    return (
        <div className='single-popup-container'>
            {neighborPopUp && <NeighborPopup openSinggleImage={openSinggleImage} viewImage={viewImage} />}
            <div className='popup-content-background row'>
                <div className='single-popup-image-container col'>
                    <div className='single-img-wrapper'>
                        <div className='img-info'>
                            <span>{viewImage.date}</span>
                            <span>{viewImage.time}</span>
                        </div>
                        <img src={viewImage.image} alt='single-popup'/>
                    </div>
                    
                    <div className='button-container'>
                        <button className='btn btn-primary' onClick={() => {setNeighborPopUp(true)}}>Neighbors</button>
                        <button style={{backgroundColor : viewImage.status === 1 ? 'red' :''}} className='btn btn-success' onClick={() => handleSelectClick()}>{viewImage.status === 1 ? 'Unselct' :'Select'}</button>
                    </div>
                </div>
                <div className='similar-image-container col'>
                    <h4>Similars</h4>
                    <div className='similar-images-list-wrapper'>
                        <div className='similar-images-list'>
                            {similarImages.map((image, index) => {
                                return <ImageInList key={index} record={image} index={index} handleImageClick={handleImageClick} openSinggleImage={openSinggleImage}/>; 
                            })}
                        </div>
                    </div>
                    
                </div>
                <div className='close-button-container'>
                    <img src={closeIcon} className='close-popup-button' onClick={() => setSimilarPopUp(false)}/>
                </div>
                
            </div>
        </div>
    );
}

export default SinglePopup;