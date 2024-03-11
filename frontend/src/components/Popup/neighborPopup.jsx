import './neighborPopup.css'
import closeIcon from '../../assets/close.png'
import bcn from '../../assets/bcn.png'
import ImageInList from '../Image/imageInList'

const NeighborPopup = ({image, closePopup, openSinggleImage}) => {
    const images = [image]
    return (
        <div className='neighbor-popup-container'>
            <div className='popup-content-background row'>
                <div className='neighbor-image-container col'>
                    <h4>Similars</h4>
                    <div className='neighbor-images-list-wrapper'>
                        <div className='neighbor-images-list'>
                            {images.map((image, index) => {
                                <ImageInList record={image} index={index} handleImageClick={() => {}} openSinggleImage={() => {}}/>
                            })}
                        </div>
                    </div>
                    
                </div>
                <div className='close-button-container' onClick={closePopup}>
                    <img src={closeIcon} className='close-popup-button' onClick={closePopup}/>
                </div>
                
            </div>
        </div>
    );
}

export default NeighborPopup;