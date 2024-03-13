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
            var totalNumbers = imageDataUrls.length;
            var halfNumbers = totalNumbers/2;
            setActiveNeighbors(imageDataUrls.slice(halfNumbers, halfNumbers + 50));
            setBottomPage(halfNumbers/50);
            setTopPage(halfNumbers/50);
            setChangedPage(1);

        })
        .catch((error) => {
            console.error('Error fetching similar images:', error);
        });
    }, [viewImage]);

    const fetchImages = async (index, max) => {
        if (index >= activeNeighbors.length) {
            return;
        }
        if (index < max) {
            // console.log(index, imageUrls)
            const url = activeNeighbors[index].path;
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

                    // Add the image data to imageDataUrls
                    // imageDataUrls.push({ 'image': imageDataUrl, 'path' : url, 'status': 0, 'date': date, 'time': time });

                    setActiveNeighbors(prevImageUrls => {
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

    const [topPage, setTopPage] = useState(1);
    const [bottomPage, setBottomPage] = useState(1);
    const [changedPage, setChangedPage] = useState(1);
    const [isAtBottom, setIsAtBottom] = useState(false);
    const [isAtTop, setIsAtTop] = useState(false);

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
            const isTop = scrollTop === 0;
            console.log('isTop', isTop)
            console.log('isBottom', isBottom);
            console.log('topPage', topPage);
            console.log('bottomPage', bottomPage);
            
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
        // setIsLoading(true);
        // setError(null);
        if (topPage == 1) {
            return;
        }
        console.log("i tried")
      
        try {

            console.log("fetch data top ", (topPage - 1) * 50 - 50, " ", (topPage - 1) * 50)
            var data = neighbors.slice((topPage - 1) * 50 - 50, (topPage - 1) * 50);
            setActiveNeighbors(prevItems => [...data, ...prevItems]);
            setTopPage(topPage => topPage - 1);
            setChangedPage(topPage);
        } catch (error) {
            console.log('error', error);
        //   setError(error);
        } finally {
            setIsAtTop(false);
        }
    };

    const fetchDataBottom = async () => {
        // setIsLoading(true);
        // setError(null);
        if (bottomPage * 50 > neighbors.length) {
            return;
        }
      
        try {
            console.log("fetch data bottom ", (bottomPage + 1) * 50, " ", (bottomPage + 1) * 50 + 50);
            var data = neighbors.slice((bottomPage + 1) * 50, (bottomPage + 1) * 50 + 50);
            setActiveNeighbors(prevItems => [...prevItems, ...data]);
            setBottomPage(prevPage => prevPage + 1);
            setChangedPage(bottomPage);
        } catch (error) {
            console.log('error', error);
        //   setError(error);
        } finally {
            setIsAtBottom(false);
        }
    };

    useEffect(() => {
        if (isAtBottom) {
            fetchDataBottom();
        }
    }, [isAtBottom]);

    useEffect(() => {
        if (isAtTop) {
            fetchDataTop();
        }
    }, [isAtTop]);

    useEffect(() => {
        if (activeNeighbors.length > 0) {
            // if (changedPage == bottomPage) {
                var topPage = 0;
                var botPage = activeNeighbors.length / 50 - 1
                console.log("top and bot page: ", topPage * 50, botPage * 50);
                // console.log("prevpage * 50: ", prevPage * 50);

                // console.log(activeNeighbors[prevPage * 50]);

                if (activeNeighbors[topPage * 50].image == "") {
                    // console.log(activeNeighbors[prevPage * 50]);
                    fetchImages(topPage * 50, topPage * 50 + 50);
                }
                else if (activeNeighbors[botPage * 50].image == "") {
                    // console.log(activeNeighbors[topPage * 50]);
                    fetchImages(botPage * 50, botPage * 50 + 50);
                }
            // }
        }
    }, [activeNeighbors])

    return (
        <div className='neighbor-popup-container'>
            <div className='popup-content-background row'>
                <div className='neighbor-image-container col'>
                    <h4>Neighbors</h4>
                    <div className='neighbor-images-list-wrapper' ref={containerRef}>
                        <div className='neighbor-images-list' >
                            {activeNeighbors.map((image, index) => {
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