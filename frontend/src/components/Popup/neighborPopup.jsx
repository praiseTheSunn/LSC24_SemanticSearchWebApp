import './neighborPopup.css'
import closeIcon from '../../assets/close.png'
import bcn from '../../assets/bcn.png'
import ImageInList from '../Image/imageInList'
import { useRef, useEffect, useState } from 'react'
import imageService from '../../services/imageService'
import { useSelectedImages } from '../../contexts/selectedImageContext'


const NeighborPopup = ({ viewImage, onClose }) => {

    // Display viewImage , fetch API to get neibors of viewImage, display neighbors in a list
    // Link doc cua API: http://34.124.236.208:8001/docs
    // Tạo service mới cho API get neighbor
    // const {setNeighborPopUp} = usePopUp();
    // const [neighbors, setNeighbors] = useState([]);
    // const [activeNeighbors, setActiveNeighbors] = useState([]);
    // // const containerRef = useRef(null);
    // const [isLoading, setIsLoading] = useState(false);

    const [neighborsData, setNeighborsData] = useState(null);
    useEffect(() => {
        imageService.getNeighbors(viewImage).then((response) => {
            console.log('image neighbors', response.data);
            setNeighborsData(response.data.response);
        });
    }, [viewImage]);
    console.log('neighborsData in popup', neighborsData)


    return (
        <div className='neighbor-popup-container'>
            <div className='popup-content-background row'>
                <div className='neighbor-image-container col'>
                    <h1>Neighbors</h1>
                    <br/>
                    {/* <div className='neighbor-images-list-wrapper'>
                        <div className='neighbor-images-list' >
                            
                        </div>
                    </div> */}
                    <div className='grid-neighbor'>

                        {neighborsData ? (
                            neighborsData.map((data, index) => {
                                const { img_link, date, time } = data;
                                const formattedTime = `${date}  ${time}`;
                                return (
                                    <div key={index} className='image-wrapper-neighbor'>
                                        <div className='overlay-neighbor'>{formattedTime}</div>
                                        <img
                                            src={img_link}
                                            alt={`Image ${index}`}
                                            className='image-item-neighbor'
                                        // onClick={() => openSinggleImage(null, path, date, time)}
                                        />
                                    </div>
                                );
                            })
                        ) : (
                            <div>Loading neighbors...</div>
                        )}
                    </div>
                </div>
                <div className='close-button-container'>
                    <img src={closeIcon} className='close-popup-button' onClick={() => onClose(true)}/>
                </div>

            </div>
        </div>
    );
}

export default NeighborPopup;