import './neighborPopup.css'
import closeIcon from '../../assets/close.png'
import bcn from '../../assets/bcn.png'

const NeighborPopup = ({image, closePopup}) => {
    const images = [bcn, bcn, bcn, bcn, bcn, bcn, bcn, bcn,
        bcn, bcn, bcn, bcn, bcn, bcn, bcn, bcn,bcn, bcn, bcn, bcn, bcn, bcn, bcn, bcn,
        bcn, bcn, bcn, bcn, bcn, bcn, bcn, bcn,bcn, bcn, bcn, bcn, bcn, bcn, bcn, bcn]
    return (
        <div className='neighbor-popup-container'>
            <div className='popup-content-background row'>
                <div className='neighbor-image-container col'>
                    <h4>Similars</h4>
                    <div className='neighbor-images-list-wrapper'>
                        <div className='neighbor-images-list'>
                            {images.map((image, index) => {
                                return (
                                    <div key={index} className='img-container'>
                                        <div className='neighbor-img-wrapper'>
                                            <img src={image} alt='neighbor' className='neighbor-image'/>
                                        </div>
                                    </div>
                                )
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