import './neighborPopup.css'
import closeIcon from '../../assets/close.png'
import bcn from '../../assets/bcn.png'
import ImageInList from '../Image/imageInList'
import { useRef, useEffect, useState } from 'react'
import imageService from '../../services/imageService'
import { useSelectedImages } from '../../contexts/selectedImageContext'
import { usePopUp } from '../../contexts/popUpContext'

const NeighborPopup = ({viewImage, openSinggleImage}) => {
    const {setNeighborPopUp} = usePopUp();
    const [neighbors, setNeighbors] = useState([]);
    const [activeNeighbors, setActiveNeighbors] = useState([]);
    const containerRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const response2 = imageService.getNeighbors(viewImage.path)
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
            console.log('imageDataUrls neigh', imageDataUrls);
            setNeighbors(imageDataUrls);

            // var totalPages = ~~(imageDataUrls.length/50);
            // var halfPage = ~~(totalPages/2);

            // console.log("starting data: ", halfPage * 50, halfPage * 50 + 50);
            // // setActiveNeighbors(imageDataUrls.slice(halfPage * 50, halfPage * 50 + 50));
            
            // setBottomPage((halfPage));
            // setTopPage((halfPage) + 1);
        })
        .catch((error) => {
            console.error('Error fetching similar images:', error);
        });
    }, [viewImage]);

    useEffect(() => {
        var totalPages = ~~(neighbors.length/50);
        var halfPage = ~~(totalPages/2);

        // console.log("starting data: ", halfPage * 50, halfPage * 50 + 50);
        // setActiveNeighbors(imageDataUrls.slice(halfPage * 50, halfPage * 50 + 50));
        
        if (neighbors[halfPage * 50] !== undefined && neighbors[halfPage * 50].image == "") {
            fetchImages(halfPage * 50, halfPage * 50 + 50, true);
            
            setBottomPage((halfPage));
            setTopPage((halfPage) + 1);
        }
        else {
            console.log("neighbors updated", neighbors);
        }
    }, [neighbors]);

    const fetchImages = (index, max, addToFront) => {
        var copy = [];
        fetchImagesToCopy(index, index, max, copy, addToFront);
    }

    const fetchImagesToCopy = (index, max, copy, addToFront) => {
        // console.log("fetching ", index, " ", max, " ", copy.length, " ", neighbors.length)
        // console.log(copy);
        if (index < neighbors.length && index < max) {
            // console.log(index, imageUrls)
            const url = activeNeighbors[index].path.replace(/\//g, '\\');
            // console.log("fetching " + index + "th url: " + url);

            imageService.getImage(url)
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

                    // Add the image data to copy
                    copy.push({ 'image': imageDataUrl, 'path' : url, 'status': 0, 'date': date, 'time': time });

                    // Recursive call to fetch the next image
                    // return fetchImages(index + 1, max);
                    copy = fetchImagesToCopy(index + 1, max, copy, addToFront);
                })
                .catch((error) => {
                    console.error('Error fetching image:', error);
                });
                return copy;
        } else {
            // All images fetched, set the state or do other operations
            console.log("finished fetching a page");
            // console.log(neighbors);
            setActiveNeighbors(prevActiveNeighbors => {
                if (addToFront) {
                    return [...copy, ...prevActiveNeighbors];
                }
                else {
                    return [...prevActiveNeighbors, ...copy];
                }
                // for (var i = min; i < max; i++) {
                //     prevActiveNeighbors[i] = copy[i];
                // }
                // return prevActiveNeighbors;
            });
            return copy;
        }
    };

    const { selectedImages, addSelectedImage, removeSelectedImage } = useSelectedImages();

    const handleImageClick = (imageUrl, image) => {
        const fileName = imageUrl.split('\\').pop();
        // console.log('clicked',fileName);
        if(selectedImages.some(image => image.url.includes(fileName))){
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

    const [topPage, setTopPage] = useState(1);
    const [bottomPage, setBottomPage] = useState(1);
    const [isAtBottom, setIsAtBottom] = useState(false);
    const [isAtTop, setIsAtTop] = useState(false);

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
            const isTop = scrollTop === 0;
            // console.log('isTop', isTop)
            // console.log('isBottom', isBottom);
            // console.log('topPage', topPage);
            // console.log('bottomPage', bottomPage);
            
            setIsAtBottom(isBottom);
            setIsAtTop(isTop);

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

    const fetchDataTop = async () => {
        if (topPage == 1) {
            setIsLoading(false);
            return;
        }
      
        try {
            console.log("fetch data top ", (topPage - 1) * 50 - 50, " ", (topPage - 1) * 50)
            // var data = neighbors.slice((topPage - 1) * 50 - 50, (topPage - 1) * 50);
            // setActiveNeighbors(prevItems => [...data, ...prevItems]);
            fetchImages((topPage - 1) * 50 - 50, (topPage - 1) * 50, true);
            setTopPage(topPage => topPage - 1);
        } catch (error) {
            console.log('error', error);
        //   setError(error);
        } finally {
            setIsAtTop(false);
            setIsLoading(false);
        }
    };

    const fetchDataBottom = async () => {
        if (bottomPage * 50 > neighbors.length) {
            setIsLoading(false);
            return;
        }
      
        try {
            console.log("fetch data bottom ", (bottomPage + 1) * 50, " ", (bottomPage + 1) * 50 + 50);
            // var data = neighbors.slice((bottomPage + 1) * 50, (bottomPage + 1) * 50 + 50);
            // setActiveNeighbors(prevItems => [...prevItems, ...data]);
            fetchImages((bottomPage + 1) * 50, (bottomPage + 1) * 50 + 50, false);
            setBottomPage(prevPage => prevPage + 1);
        } catch (error) {
            console.log('error', error);
        //   setError(error);
        } finally {
            setIsAtBottom(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAtBottom && isLoading === false) {
            setIsLoading(true);
            fetchDataBottom();
            
        }
    }, [isAtBottom]);

    useEffect(() => {
        if (isAtTop && isLoading === false) {
            setIsLoading(true);
            fetchDataTop();
        }
    }, [isAtTop]);

    return (
        <div className='neighbor-popup-container'>
            <div className='popup-content-background row'>
                <div className='neighbor-image-container col'>
                    <h4>Neighbors</h4>
                    <div className='neighbor-images-list-wrapper' ref={containerRef}>
                        <div className='neighbor-images-list' >
                            {activeNeighbors.map((image, index) => {
                                // if (image.image !== "") {
                                    return <ImageInList key={index} record={image} index={index} handleImageClick={handleImageClick} openSinggleImage={openSinggleImage}/>;
                                // }
                                // else {
                                    // return null;
                                // }
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