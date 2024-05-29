import view_icon from '../assets/view_icon.png';
import React from 'react';
import { usePopUp } from '../contexts/popUpContext';

const AnImage = ({data, index}) => {
    const src = data && data.img_link ? data.img_link : null;
    const date = data && data.date ? data.date : null;
    const time = data && data.time ? data.time : null;
    const formattedTime = `${date}  ${time}`;
    const json_data = JSON.stringify(data);

    const {neighborPopUp, setNeighborPopUp} = usePopUp();
    const {similarPopUp, setSimilarPopUp} = usePopUp();
    // const {currentImage, setCurrentImage} = usePopUp();

    return (
        <div key={index} 
        className='an-img-container relative w-full h-full hover:z-50 hover:scale-105 overflow-hidden rounded-xl transition-transform duration-300 ease-in-out' 
        data-tooltip-id="tooltip_img"
        data-tooltip-content={json_data}
        data-tooltip-variant='dark'
        onDoubleClick={() => {
            setSimilarPopUp(data);
            setNeighborPopUp(null);
            console.log('double clicked', data, similarPopUp);
            // setCurrentImage(data);
        }
        }
        
        >
            {/* {neighborPopUp && createPortal(
                <NeighborPopup viewImage={data.img_link} onClose={() => setNeighborPopUp(false)} />,
                document.body
            )}
            {similarPopup && createPortal(
                <SinglePopup viewImage={imageLink} onClose={() => setSimilarPopUp(false)} />,
                document.body
            )    
            } */}
            <style>
                {`.an-img-container:hover .img-action-eye { display: block;}`}
                {'.an-img-container:hover  .image-item-img { border: 2px solid rgb(0, 47, 255); }'}
                {/* {'.an-img-container:hover .info-item { transform: scale(1.05);  }'} */}
                {/* {'an-img-container:hover .image-item-img {  }'} */}

            </style>
            <div className='info-item text-xs text-white bg-black opacity-60 absolute top-0 left-0 py-1'>{formattedTime}</div>
            <img
                src={src}
                alt={`Image ${index}`}
                // className=' object-contain w-full max-h-[140px] cursor-pointer'
                className='  max-w-full h-full cursor-pointer mx-auto  image-item-img bg-white submissible'
                // onClick={() => setImageLink(src)}
            />
            <div className='bg-black opacity-50 absolute bottom-0 right-0 img-action-eye z-50 hidden'
           onClick={() => {setNeighborPopUp(data); setSimilarPopUp(null)}}
            >
                <img
                    src={view_icon}
                    alt={`View ${index}`}
                    className='size-7'
                />
            </div>
        </div>
    );
}

export default AnImage;