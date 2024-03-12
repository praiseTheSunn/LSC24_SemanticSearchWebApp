import './rightPanel.css'
import React, { useRef, useEffect, useState } from 'react';
import { useSelectedImages } from '../selectedImageContext';
import imageService from '../services/imageService';
// import LazyLoad from 'react-lazy-load';

import SinglePopup from '../components/Popup/singlePopup';
import NeighborPopup from '../components/Popup/neighborPopup';
import ImageInList from './Image/imageInList';

const RightPanel = ({query, filters}) => {
    const [imageUrls, setImageUrls] = useState([    ]);

    const [activeImageUrls, setActiveImageUrls] = useState([    ]);
  
    const containerRef = useRef(null);

    const { selectedImages, addSelectedImage, removeSelectedImage, getSize } = useSelectedImages();

    const handleImageClick = (imageUrl) => {
        const fileName = imageUrl.split('\\').pop();
        console.log('clicked',fileName);
        if(selectedImages.includes(fileName)){
            removeSelectedImage(fileName);
            const updatedImages = imageUrls.map((record) => {
                if (record.path === imageUrl) {
                    return { ...record, status: 0 };
                }
                return record;
            });
            setImageUrls(updatedImages);
        }else{
            console.log('adding',fileName);
            addSelectedImage(fileName);
            const updatedImages = imageUrls.map((record, i) => {
                if (record.path === imageUrl) {
                    return { ...record, status: 1 };
                }
                return record;
            });
            setImageUrls(updatedImages);
        }
    }

    const handleClick = () => {
        // First HTTP request
        const response2 = imageService.getImages("blah blah blah")
            .then(async (response2) => {
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
                setImageUrls(imageDataUrls)
                setActiveImageUrls(imageDataUrls.slice(0, 50));
                
            })
            .catch((error) => {
                console.error('Error fetching images:', error);
            });
    
        // You can add more code here or handle subsequent actions after the requests
        
    }

    const [viewImage, setViewImage] = useState({image: "", path:""});
    
    
    const closePopup = () => {
        console.log('closePopup');
        setViewImage({image :"", path: ""});
    }

    const openSinggleImage = (image, path) => {
        setViewImage({image: image, path: path});
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
            console.log(isBottom)

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

    const fetchImages = async (index, max) => {
        if (index < max) {
            // console.log(index, imageUrls)
            const url = activeImageUrls[index].path;
            console.log("fetching " + index + "th url: " + url);

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

                    // Add the image data to imageDataUrls
                    // imageDataUrls.push({ 'image': imageDataUrl, 'path' : url, 'status': 0, 'date': date, 'time': time });

                    setActiveImageUrls(prevImageUrls => {
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

    const fetchData = async () => {
        try {

            var data = imageUrls.slice(page * 50, page * 50 + 50);
            setActiveImageUrls(prevItems => [...prevItems, ...data]);
            setPage(prevPage => prevPage + 1);

        } catch (error) {
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

    useEffect(() => {
        if (activeImageUrls.length > 0) {
            var prevPage = page - 1;
            if (activeImageUrls[prevPage * 50].image == "") {

                console.log(activeImageUrls[prevPage * 50]);
                fetchImages(prevPage * 50, prevPage * 50 + 50);
            }
        }
    }, [activeImageUrls])


    return(
        <div className='right-content-container'>
            {viewImage.path !== "" && <SinglePopup closePopup={closePopup} viewImage={viewImage} openSinggleImage={openSinggleImage} />}
            <div className='submit-button-area'>
                <button className='btn btn-primary submit-button' onClick={handleClick}>Submit</button>
                <span className='submit-button-text'>Selected: {getSize()}</span>
            </div>
            <div className='grid-container' ref={containerRef}>
            {activeImageUrls.map((record, index) => {
                return <ImageInList key={index} record={record} index={index} 
                    handleImageClick={handleImageClick} openSinggleImage={openSinggleImage}
                    setImageUrls={setActiveImageUrls}
                />;
                })}
            </div>
        </div>
    )
};

export default RightPanel;