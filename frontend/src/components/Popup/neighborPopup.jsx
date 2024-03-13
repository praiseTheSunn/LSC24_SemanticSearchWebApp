import './neighborPopup.css'
import closeIcon from '../../assets/close.png'
import bcn from '../../assets/bcn.png'
import ImageInList from '../Image/imageInList'
import { useEffect, useState } from 'react'
import imageService from '../../services/imageService'
import { useSelectedImages } from '../../contexts/selectedImageContext'
import { usePopUp } from '../../contexts/popUpContext'

const NeighborPopup = ({viewImage, openSinggleImage}) => {
    const {setNeighborPopUp} = usePopUp();
    const [neighbors, setNeighbors] = useState([]);
    useEffect(() => {
        const response2 = imageService.getNeighbors(viewImage.path)
        .then((response2) => {
            // Convert the byte data to a base64-encoded string
            var urls = response2.data['image_files'];
            var imageDataUrls = [];

            // Second HTTP request (sequentially inside the loop)
            // You can use Promise.all() if you want to make requests concurrently
            const fetchImages = (index) => {
                if (index < 60) {
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

                            const is_origin = url === viewImage.path ? 1 : 0;
                            // console.log('is_origin', is_origin, url, viewImage.path);
                            // Add the image data to imageDataUrls
                            imageDataUrls.push({ 'image': imageDataUrl, 'path' : url, 'status': 0, 'date': date, 'time': time ,'is_origin': is_origin});
                            
                            // console.log('imageDataUrls', imageDataUrls);
                            // Recursive call to fetch the next image
                            return fetchImages(index + 1);
                        })
                        .catch((error) => {
                            console.error('Error fetching image:', error);
                        });
                } else {
                    // All images fetched, set the state or do other operations
                    setNeighbors(imageDataUrls);
                    // console.log('imageDataUrls', imageDataUrls);
                    
                }
            };

            // Start fetching images from index 0
            return fetchImages(0);
        })
        .catch((error) => {
            console.error('Error fetching similar images:', error);
        });
    }, [viewImage]);

    const { selectedImages, addSelectedImage, removeSelectedImage } = useSelectedImages();

    const handleImageClick = (imageUrl, image) => {
        const fileName = imageUrl.split('\\').pop();
        // console.log('clicked',fileName);
        if(selectedImages.includes(fileName)){
            removeSelectedImage(fileName);
            const updatedImages = neighbors.map((record) => {
                if (record.path === imageUrl) {
                    return { ...record, status: 0 };
                }
                return record;
            });
            setNeighbors(updatedImages);
        }else{
            // console.log('adding',fileName);
            addSelectedImage(fileName, image);
            const updatedImages = neighbors.map((record, i) => {
                if (record.path === imageUrl) {
                    return { ...record, status: 1 };
                }
                return record;
            });
            setNeighbors(updatedImages);
        }
    }    

    return (
        <div className='neighbor-popup-container'>
            <div className='popup-content-background row'>
                <div className='neighbor-image-container col'>
                    <h4>Neighbors</h4>
                    <div className='neighbor-images-list-wrapper'>
                        <div className='neighbor-images-list'>
                            {neighbors.map((image, index) => {
                                return <ImageInList key={index} record={image} index={index} handleImageClick={handleImageClick} openSinggleImage={openSinggleImage}/>;
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