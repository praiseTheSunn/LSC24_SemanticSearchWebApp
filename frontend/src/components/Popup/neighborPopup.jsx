import './neighborPopup.css'
import closeIcon from '../../assets/close.png'
import bcn from '../../assets/bcn.png'
import ImageInList from '../Image/imageInList'
import { useRef, useEffect, useState } from 'react'
import imageService from '../../services/imageService'
import { useSelectedImages } from '../../contexts/selectedImageContext'
import { usePopUp } from '../../contexts/popUpContext'

const NeighborPopup = ({viewImage, openSinggleImage}) => {

    // Display viewImage , fetch API to get neibors of viewImage, display neighbors in a list
    // Link doc cua API: http://34.124.236.208:8001/docs
    // Tạo service mới cho API get neighbor
    const {setNeighborPopUp} = usePopUp();
    const [neighbors, setNeighbors] = useState([]);
    const [activeNeighbors, setActiveNeighbors] = useState([]);
    const containerRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);

    return (
        <div className='neighbor-popup-container'>
            <div className='popup-content-background row'>
                <div className='neighbor-image-container col'>
                    <h4>Neighbors</h4>
                    <div className='neighbor-images-list-wrapper' ref={containerRef}>
                        <div className='neighbor-images-list' >
                            {activeNeighbors.map((image, index) => {
                                // if (image.image !== "") {
                                    return <ImageInList key={index} record={image} index={index} handleImageClick={handleImageClick} openSinggleImage={openSinggleImage}/>;
                                // }
                                // else {
                                    // return null;
                                // }
                            })}
                        </div>
                    </div>
                    
                </div>
                <div className='close-button-container'>
                    <img src={closeIcon} className='close-popup-button' onClick={() => setNeighborPopUp(false)}/>
                </div>
                
            </div>
        </div>
    );
}

export default NeighborPopup;