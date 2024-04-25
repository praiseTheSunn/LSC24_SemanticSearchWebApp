import './rightPanel.css'
import React, { useRef, useEffect, useState } from 'react';
import { useSelectedImages } from '../contexts/selectedImageContext';
import imageService from '../services/imageService';
// import LazyLoad from 'react-lazy-load';

import SinglePopup from '../components/Popup/singlePopup';
import close_icon from '../assets/close.png';
import ImageInList from './Image/imageInList';
import { usePopUp } from '../contexts/popUpContext';

const RightPanel = ({query, filters, setDisplayedFilters}) => {
    const [imageUrls, setImageUrls] = useState([    ]);
    const [activeImageUrls, setActiveImageUrls] = useState([    ]);
    const containerRef = useRef(null);

    const { selectedImages, addSelectedImage, removeSelectedImage, getSize, removeAllSelected, displayedImages } = useSelectedImages();
    const {similarPopUp, setSimilarPopUp, setNeighborPopUp, setLoadingPopUp} = usePopUp();

    const handleImageClick = (imageUrl, image) => {
        const fileName = imageUrl.split('\\').pop();
        console.log('clicked',fileName);
        console.log('selectedImages',selectedImages);
        
        if (selectedImages.some(image => image.url.includes(fileName))) {
            removeSelectedImage(fileName);
            const updatedImages = activeImageUrls.map((record) => {
                if (record.path === imageUrl) {
                    return { ...record, status: 0 };
                }
                return record;
            });
            setActiveImageUrls(updatedImages);
        }else{
            // console.log('adding',fileName);
            addSelectedImage(fileName, image);
            const updatedImages = activeImageUrls.map((record) => {
                if (record.path === imageUrl) {
                    console.log('FOUNDS',record.path, imageUrl);
                    return { ...record, status: 1 };
                }
                return record;
            });
            setActiveImageUrls(updatedImages);
        }
        
    }

    useEffect(() => {
        if (query !== '') {
            setLoadingPopUp(true);
            // First HTTP request
            const response2 = imageService.getImages(query)            // change query here    
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
                    // setActiveImageUrls(imageDataUrls.slice(0, 50));
                    const fetchedFiltersString = response2.data['filters'];
                    const fetchedFilters = JSON.parse(fetchedFiltersString);
                    
                    console.log('filters fron right', fetchedFilters);
                    const updatedFilters = Object.entries(fetchedFilters).map(([key, value]) => {
                        console.log('obj', key, value);
                        if (key === 'obj' && value.length > 0) {
                            return { category: 'objects', value: value, status: 1 };
                        }else if (key === 'time' && value.length > 0) {
                            return { category: 'time', value: value, status: 1 };
                        }else if (key === 'loc_sem' && value) {
                            return { category: 'semantic location', value: value, status: 1 };
                        }else if (key === 'loc_cat' && value.length > 0) {
                            return { category: 'location category', value: value, status: 1 };
                        }else if (key === 'date' && value) {
                            return { category: 'time', value: value, status: 1 };
                        }
                    }).filter(filter => filter !== undefined);
                    setDisplayedFilters(previousState => [...previousState, ...updatedFilters]);
                    
                    console.log('filters fron right', fetchedFilters);
                })
                .catch((error) => {
                    console.error('Error fetching images:', error);
                });
        
            // You can add more code here or handle subsequent actions after the requests
        }
    }, [query]);

    useEffect(() => {
        console.log('updated imageUrls',imageUrls, 'active', activeImageUrls); 
        if (imageUrls.length && !activeImageUrls.length) {
            fetchImages(0, 50);
        }
        else {
            console.log("imageUrls updated", imageUrls);
        }
        setLoadingPopUp(false);
    }, [imageUrls]);


    const [viewImage, setViewImage] = useState({image: "", path:"", date:"", time:""});
    


    const openSinggleImage = (image, path, date, time) => {
        setViewImage({image: image, path: path, date: date, time: time});
        setSimilarPopUp(true);
        setNeighborPopUp(false);
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
            // console.log('scrollHeight',scrollHeight)
            // console.log('scrollTop',scrollTop)  
            // console.log('clientHeight',clientHeight)

            // Check if the user is at the bottom (you can adjust the threshold if needed)
            const isBottom = scrollHeight - scrollTop - 100 <= clientHeight;
            // console.log(isBottom)

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

    const fetchImages = (index, max) => {
        var copy = [];
        fetchImagesToCopy(index, max, copy);
    }

    const fetchImagesToCopy = (index, max, copy) => {
        if (index < max) {
            if (imageUrls[index] === undefined) 
                return copy;
            console.log(index, imageUrls[index])
            const url = imageUrls[index].path;
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
                    copy.push({ 'image': imageDataUrl, 'path' : url, 'status': 0, 'date': date, 'time': time });
                    console.log("fetched " + index + "th url: " + url);
                    // Recursive call to fetch the next image
                    copy = fetchImagesToCopy(index + 1, max, copy);
                })
                .catch((error) => {
                    console.error('Error fetching image:', error);
                });
                return copy;
        } else {
            // All images fetched, set the state or do other operations
            console.log("finished fetching a page");
            // console.log(neighbors);
            setActiveImageUrls(prevActiveUrls => {
                return [...prevActiveUrls, ...copy];
            });
            return copy;
        }
    };

    const fetchData = async () => {
        try {
            fetchImages(page * 50, page * 50 + 50);
            setPage(prevPage => prevPage + 1);

        } catch (error) {
            console.log('error in fetching data', error);
        } finally {
            setIsAtBottom(false);
        }
      };

    useEffect(() => {
    if (isAtBottom) {
        fetchData();
    }
    }, [isAtBottom]);

    const handleClick = () => {
        console.log('Submit clicked');
    };
 
    useEffect(() => {
        if (!displayedImages) {
            setActiveImageUrls([]);
            setImageUrls([]);
        }
    }, [displayedImages]);


    return(
        <div className='right-content-container'>
            {similarPopUp && <SinglePopup  viewImage={viewImage} openSinggleImage={openSinggleImage} />}
            <div className='submit-button-area'>
                <button className='btn btn-primary submit-button' onClick={handleClick}>Submit</button>
                <span className='submit-button-text'>Selected: {getSize()}</span>
                <button className='btn btn-danger' onClick={() => removeAllSelected()} style={{marginLeft: '20px'}}>Clear</button>
                <div className='selected-images-area'>
                    {selectedImages.map((record, index) => (
                        <div className='thumbnail-wrapper' key={index}>
                            <img key={index} src={record.image} alt={record.url} />
                            <img src={close_icon} alt='close' className='close-icon' onClick={() => removeSelectedImage(record.url)}/>
                        </div>
                        
                    ))}
                </div>
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