import './singlePopup.css'
import closeIcon from '../../assets/close.png'
import bcn from '../../assets/bcn.png'
import NeighborPopup from './neighborPopup'
import React, {useRef, useState, useEffect } from 'react';
import imageService from '../../services/imageService';
import ImageInList from '../Image/imageInList';
import { useSelectedImages } from '../../contexts/selectedImageContext';
import { usePopUp } from '../../contexts/popUpContext';


const SinglePopup = ({viewImage, openSinggleImage}) => {
    // Display viewImage , fetch API to get similars of viewImage, display neighbors in a list
    // Link doc cua API: http://34.124.236.208:8001/docs
    // Tạo service mới cho API get neighbor
    const { setSimilarPopUp, neighborPopUp, setNeighborPopUp } = usePopUp();

    const [similarImages, setSimilarImages] = useState([]);
    const containerRef = useRef(null);

    //Fetch the similar images when the viewImage.path changes
    
    useEffect(() => {
        
    }, [similarImages]);

    const { selectedImages, addSelectedImage, removeSelectedImage } = useSelectedImages();

    

    const handleImageClick = (imageUrl, m_img) => {
        const fileName = imageUrl.split('\\').pop();
        console.log('selectedImages',selectedImages);
        if(selectedImages.some(image => image.url.includes(fileName))){
            removeSelectedImage(fileName);
            const updatedImages = activeSimilarImages.map((record) => {
                if (record.path === imageUrl) {
                    return { ...record, status: 0 };
                }
                return record;
            });
        }else{
            addSelectedImage(fileName, m_img);
            const updatedImages = activeSimilarImages.map((record) => {
                if (record.path === imageUrl) {
                    return { ...record, status: 1 };
                }
                return record;
            });
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
                    <div className='similar-images-list-wrapper' ref={containerRef}>
                        <div className='similar-images-list' >
                            {activeSimilarImages.map((image, index) => {
                                return <ImageInList key={index} record={image} index={index} 
                                handleImageClick={handleImageClick} openSinggleImage={openSinggleImage}
                                setImageUrls={setActiveSimilarImages}
                                />; 
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