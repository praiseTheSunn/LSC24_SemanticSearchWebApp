import './singlePopup.css'
import closeIcon from '../../assets/close.png'
import bcn from '../../assets/bcn.png'

const SinglePopup = ({image, closePopup}) => {
    const images = [bcn, bcn, bcn, bcn, bcn, bcn, bcn, bcn,
        bcn, bcn, bcn, bcn, bcn, bcn, bcn, bcn,bcn, bcn, bcn, bcn, bcn, bcn, bcn, bcn,
        bcn, bcn, bcn, bcn, bcn, bcn, bcn, bcn,bcn, bcn, bcn, bcn, bcn, bcn, bcn, bcn]
    return (
        <div className='single-popup-container'>
            <div className='popup-content-background row'>
                <div className='single-popup-image-container col'>
                    {/* <img src={`data:image/jpeg;base64,${image}`} alt='single-popup-image'/> */}
                    <div className='single-img-wrapper'>
                        <img src={bcn} alt='single-popup'/>
                    </div>
                    
                    <div className='button-container'>
                        <button className='btn btn-primary'>Neighbors</button>
                        <button className='btn btn-success'>Select</button>
                    </div>
                </div>
                <div className='similar-image-container col'>
                    <h4>Similars</h4>
                    <div className='similar-images-list-wrapper'>
                        <div className='similar-images-list'>
                            {images.map((image, index) => {
                                return (
                                    <div key={index} className='img-container'>
                                        <div className='similar-img-wrapper'>
                                            <img src={image} alt='similar' className='similar-image'/>
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

export default SinglePopup;