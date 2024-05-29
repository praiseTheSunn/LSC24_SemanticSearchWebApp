// import './singlePopup.css'
// import closeIcon from '../../assets/close.png'
// import bcn from '../../assets/bcn.png'
// import NeighborPopup from './neighborPopup'
// import React, {useRef, useState, useEffect } from 'react';
// import imageService from '../../services/imageService';
// import ImageInList from '../Image/imageInList';
// import { useSelectedImages } from '../../contexts/selectedImageContext';
// import { usePopUp } from '../../contexts/popUpContext';


// const SinglePopup = ({viewImage, openSinggleImage}) => {
//     // Display viewImage , fetch API to get similars of viewImage, display neighbors in a list
//     // Link doc cua API: http://34.124.236.208:8001/docs
//     // Tạo service mới cho API get neighbor
//     const { setSimilarPopUp, neighborPopUp, setNeighborPopUp } = usePopUp();

//     const [similarImages, setSimilarImages] = useState([]);
//     const containerRef = useRef(null);

//     //Fetch the similar images when the viewImage.path changes
    
//     useEffect(() => {
        
//     }, [similarImages]);

//     const { selectedImages, addSelectedImage, removeSelectedImage } = useSelectedImages();

    

//     const handleImageClick = (imageUrl, m_img) => {
//         const fileName = imageUrl.split('\\').pop();
//         console.log('selectedImages',selectedImages);
//         if(selectedImages.some(image => image.url.includes(fileName))){
//             removeSelectedImage(fileName);
//             const updatedImages = activeSimilarImages.map((record) => {
//                 if (record.path === imageUrl) {
//                     return { ...record, status: 0 };
//                 }
//                 return record;
//             });
//         }else{
//             addSelectedImage(fileName, m_img);
//             const updatedImages = activeSimilarImages.map((record) => {
//                 if (record.path === imageUrl) {
//                     return { ...record, status: 1 };
//                 }
//                 return record;
//             });
//         }
//     }    

//     return (
//         <div className='single-popup-container'>
//             {neighborPopUp && <NeighborPopup openSinggleImage={openSinggleImage} viewImage={viewImage} />}
//             <div className='popup-content-background row'>
//                 <div className='single-popup-image-container col'>
//                     <div className='single-img-wrapper'>
//                         <div className='img-info'>
//                             <span>{viewImage.date}</span>
//                             <span>{viewImage.time}</span>
//                         </div>
//                         <img src={viewImage.image} alt='single-popup'/>
//                     </div>
                    
//                     <div className='button-container'>
//                         <button className='btn btn-primary' onClick={() => {setNeighborPopUp(true)}}>Neighbors</button>
//                         <button style={{backgroundColor : viewImage.status === 1 ? 'red' :''}} className='btn btn-success' onClick={() => handleSelectClick()}>{viewImage.status === 1 ? 'Unselct' :'Select'}</button>
//                     </div>
//                 </div>
//                 <div className='similar-image-container col'>
//                     <h4>Similars</h4>
//                     <div className='similar-images-list-wrapper' ref={containerRef}>
//                         <div className='similar-images-list' >
//                             {activeSimilarImages.map((image, index) => {
//                                 return <ImageInList key={index} record={image} index={index} 
//                                 handleImageClick={handleImageClick} openSinggleImage={openSinggleImage}
//                                 setImageUrls={setActiveSimilarImages}
//                                 />; 
//                             })}
//                         </div>
//                     </div>
                    
//                 </div>
//                 <div className='close-button-container'>
//                     <img src={closeIcon} className='close-popup-button' onClick={() => setSimilarPopUp(false)}/>
//                 </div>
                
//             </div>
//         </div>
//     );
// }

// export default SinglePopup;

import './singlePopup.css'
import closeIcon from '../../assets/close.png'
import bcn from '../../assets/bcn.png'
import ImageInList from '../Image/imageInList'
import { useRef, useEffect, useState, useCallback } from 'react'
import imageService from '../../services/imageService'
import { useSelectedImages } from '../../contexts/selectedImageContext'
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { AnImage } from '../../components';

const SinglePopup = ({ viewImage, onClose }) => {
    const [singlePopupData, setsinglePopupData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const viewImageRef = useRef(null);
    const gridRef = useRef(null);

    const fetchSimilars = useCallback(async (imageId) => {
        setIsLoading(true);
        try {
            const response = await imageService.getSimilarImages2Image(imageId);
            const newNeighbors = response.data.response;
            setsinglePopupData(newNeighbors);
            return newNeighbors;
        } catch (error) {
            console.error('Error fetching Similar Images:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const imageList = [viewImage];
        fetchSimilars(imageList, "stfm");
    }, [viewImage, fetchSimilars]);

    const Cell = ({ columnIndex, rowIndex, style }) => {
        const index = rowIndex * columnCount + columnIndex;
        const data = singlePopupData[index];
        if (!data) return null;

        const { img_link, date, time } = data;
        const formattedTime = `${date} ${time}`;
        const isHighlighted = img_link === viewImage;

        return (
            <div style={style} className={`image-wrapper-neighbor ${isHighlighted ? 'highlight' : ''}`}
                ref={isHighlighted ? viewImageRef : null}
            >
                <div className="h-full overflow-hidden p-0.5" >
                    <AnImage
                        key={index}
                        index={index}
                        data={data}
                    />
                </div>
            </div>
        );
    };

    const columnCount = 6; // Number of columns in the grid
    const itemSize = 180; // Size of each cell in the grid

    return (
        <div className='single-popup-container'>
            <div className='popup-content-background row'>
                <div className='single-images-container col h-full w-full'>
                    <h1>Similar Images</h1>
                    <br />
                    <div className='single-image-container'>
                        <div className='left-column'>
                            <img src={viewImage} alt='single-popup' className='centered-image'/>
                        </div>
                        <div className='right-column'>
                            {singlePopupData.length > 0 ? (
                                <AutoSizer>
                                    {({ height, width }) => {
                                        const columnWidth = width / columnCount;
                                        const rowHeight = 130; // Making rows square by setting row height equal to column width
                                        const rowCount = Math.ceil(singlePopupData.length / columnCount);

                                        return (
                                            <Grid
                                                columnCount={columnCount}
                                                columnWidth={columnWidth}
                                                height={height}
                                                rowCount={rowCount}
                                                rowHeight={rowHeight}
                                                width={width}
                                                ref={gridRef}
                                            >
                                                {Cell}
                                            </Grid>
                                        )
                                    }}
                                </AutoSizer>
                            ) : (
                                <div>Loading Similar Images...</div>
                            )}
                        </div>

                    </div>

                </div>

                <div className='close-button-container'>
                    <img src={closeIcon} className='close-popup-button' onClick={() => onClose(true)} />
                </div>
            </div>
        </div>
    );
};

export default SinglePopup;