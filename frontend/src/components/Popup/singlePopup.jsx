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
    const { setSimilarPopUp, neighborPopUp, setNeighborPopUp } = usePopUp();

    const [similarImages, setSimilarImages] = useState([]);
    const [activeSimilarImages, setActiveSimilarImages] = useState([]);
    const containerRef = useRef(null);

    //Fetch the similar images when the viewImage.path changes
    useEffect(() => {
        console.log('fetching similar images for', viewImage.path);
        const response2 = imageService.getSimilarImages(viewImage.path)
        .then((response2) => {
            // Convert the byte data to a base64-encoded string
            var urls = response2.data['image_files'];
            var imageDataUrls = [];

            for (var i = 0; i < urls.length; i++) {
                const now = new Date();
                const currentTimeString = now.getTime().toString();
                const data = {
                    path: urls[i],
                    image: "",
                    status: 0,
                    dateInd: currentTimeString + i.toString(),
                }
                imageDataUrls.push(data);
                
            }
            // console.log('imageDataUrls single popup', imageDataUrls);
            setSimilarImages(imageDataUrls);
            setActiveSimilarImages(imageDataUrls.slice(0, 50));
        })
        .catch((error) => {
            console.error('Error fetching similar images:', error);
        });
    }, [viewImage.path]); // Trigger the effect when viewImage.path changes

    const { selectedImages, addSelectedImage, removeSelectedImage } = useSelectedImages();

    const handleSelectClick = () => {
        const fileName = viewImage.path.split('\\').pop();
        // console.log('selectedImage', fileName);
        if(selectedImages.some(image => image.url.includes(fileName))){
            removeSelectedImage(fileName);
            viewImage.status = 0;
        }else{
            // console.log('adding',fileName);
            addSelectedImage(fileName, viewImage.image);
            viewImage.status = 1;
        }
    }

    const handleImageClick = (imageUrl, m_img) => {
        const fileName = imageUrl.split('\\').pop();
        // console.log('clicked',fileName);
        console.log('selectedImages',selectedImages);
        if(selectedImages.some(image => image.url.includes(fileName))){
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
            addSelectedImage(fileName, m_img);
            const updatedImages = similarImages.map((record) => {
                if (record.path === imageUrl) {
                    return { ...record, status: 1 };
                }
                return record;
            });
            setSimilarImages(updatedImages);
        }
    }    


    const [page, setPage] = useState(1);
    const [isAtBottom, setIsAtBottom] = useState(false);

    const handleScroll = () => {
        const container = containerRef.current;

        if (container) {
            // Calculate the scroll position
            const scrollHeight = container.scrollHeight;
            const scrollTop = container.scrollTop;
            const clientHeight = container.clientHeight;
            console.log('scrollHeight',scrollHeight)
            console.log('scrollTop',scrollTop)  
            console.log('clientHeight',clientHeight)

            // Check if the user is at the bottom (you can adjust the threshold if needed)
            const isBottom = scrollHeight - scrollTop - 100 <= clientHeight;
            console.log('isBottom', isBottom);
            

            setIsAtBottom(isBottom);

            // Trigger a function when the user reaches the bottom
        }
    };

    useEffect(() => {
        const container = containerRef.current;

        if (container) {
            // Add scroll event listener
            container.addEventListener('scroll', handleScroll);

            return () => {
            // Remove scroll event listener on component unmount
            container.removeEventListener('scroll', handleScroll);
            };
        }
    }, []);

    const fetchData = async () => {
        // setIsLoading(true);
        // setError(null);
      
        try {
            var data = similarImages.slice(page * 50, page * 50 + 50);
            setActiveSimilarImages(prevItems => [...prevItems, ...data]);
            setPage(prevPage => prevPage + 1);
        } catch (error) {
            console.log('error', error);
        //   setError(error);
        } finally {
            setIsAtBottom(false);
        }
      };

    useEffect(() => {
        if (isAtBottom) {
            fetchData();

        }
    }, [isAtBottom]);

    const fetchImages = async (index, max) => {
        if (index < max) {
            // console.log(index, imageUrls)
            const url = activeSimilarImages[index].path;
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
                    const date = url.split('\\').slice(-3, -1).join('-').replace(/(\d{4})(\d{2})-(\d{2})/, '$1-$2-$3');
                    const time = fileName.slice(9, 11) + ':' + fileName.slice(11, 13) + ':' + fileName.slice(13, 15);

                    // Add the image data to imageDataUrls
                    // imageDataUrls.push({ 'image': imageDataUrl, 'path' : url, 'status': 0, 'date': date, 'time': time });

                    setActiveSimilarImages(prevImageUrls => {
                        // Make a copy of the previous state
                        const newImageUrls = [...prevImageUrls];

                        // Update the copy of state based on previous values
                        newImageUrls[index] = {
                            ...newImageUrls[index],
                            image: imageDataUrl,
                            date: date,
                            time: time,
                        };

                        return newImageUrls;
                    });

                    // Recursive call to fetch the next image
                    return fetchImages(index + 1, max);
                })
                .catch((error) => {
                    console.error('Error fetching image:', error);
                });
        } else {
            // All images fetched, set the state or do other operations
        }
    };

    useEffect(() => {
        if (activeSimilarImages.length > 0) {
            var prevPage = page - 1;
            if (activeSimilarImages[prevPage * 50].image == "") {

                console.log(activeSimilarImages[prevPage * 50]);
                fetchImages(prevPage * 50, prevPage * 50 + 50);
            }
        }
    }, [activeSimilarImages])

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